#!/usr/bin/env python3
"""Acquire one video's source files through yt-dlp, with bounded auth fallback.

Python 3.9+, standard library only. Credentials and signed media URLs stay out
of the report. Each retry extracts the original page again, never cached JSON.
"""

import argparse
import datetime as dt
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import uuid
from urllib.parse import parse_qs, urlparse


HINTS = {
    "http_412": "网站拒绝当前请求。在本机浏览器登录并正常播放后，指定 --browser edge/chrome/firefox 重试。",
    "http_403": "访问被拒绝；已限制刷新重试。请确认浏览器能播放、登录态有效且下载与浏览器网络一致。403 本身不能确定具体原因。",
    "rate_limited": "网站限流，本次停止。稍后再试，不要增加并发或反复重试。",
    "login_required": "需要有效登录态。请在本机浏览器登录后指定 --browser；已授权的 Cookie 不代表拥有所有视频权限。",
    "restricted": "来源提示区域、会员、私有或不可用限制。请确认当前账号有权观看，或提供已获得的本地源文件。",
    "cookie_access": "无法读取或解密浏览器 Cookie。检查浏览器配置、系统钥匙串/权限；Windows 可尝试关闭浏览器或改用已登录的 Firefox。也可指定本地 Netscape cookies.txt。",
    "network": "网络或连接超时。检查当前执行机器的网络和代理；浏览器与下载器应使用相同可用网络。",
    "certificate": "本地证书链验证失败。修复 Python/系统证书或代理证书配置，不要关闭 TLS 验证。",
    "tool_version": "yt-dlp 版本或参数不兼容。使用原安装方式更新 yt-dlp 后重试。",
    "format_unavailable": "没有符合所选画质的媒体格式。检查登录态、可用格式及 --max-height。",
    "no_subtitles": "未取得所选语言的字幕。可尝试已授权的浏览器登录态；仍无字幕时下载音频并运行配置好的 ASR。",
    "artifact_invalid": "命令结束但产物未通过文件/媒体检查，不能视为成功。请检查来源与 ffmpeg。",
    "unknown": "获取失败。查看报告中的阶段、错误摘要和工具版本，再做针对性排查。",
}


def normalize_url(value):
    value = value.strip().replace("\\&", "&")
    if re.fullmatch(r"BV[a-zA-Z0-9]{10}", value):
        return "bilibili", f"https://www.bilibili.com/video/{value}"
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in ("http", "https") or parsed.username or parsed.password:
        raise ValueError("请提供一个 B 站/YouTube 视频链接或 BV 号。")
    query = parse_qs(parsed.query)
    if host == "bilibili.com" or host.endswith(".bilibili.com"):
        match = re.search(r"/video/(BV[a-zA-Z0-9]{10})(?:/|$)", parsed.path)
        bvid = match.group(1) if match else query.get("bvid", [""])[0]
        if not re.fullmatch(r"BV[a-zA-Z0-9]{10}", bvid):
            raise ValueError("链接中未找到有效 BV 号；暂不接收合集列表或番剧地址。")
        part = query.get("p", [None])[0]
        if part is not None and (not part.isdigit() or int(part) < 1):
            raise ValueError("分 P 参数必须为正整数。")
        return "bilibili", f"https://www.bilibili.com/video/{bvid}" + (f"?p={int(part)}" if part else "")
    if host in ("b23.tv", "www.b23.tv"):
        if not re.fullmatch(r"/[a-zA-Z0-9]+/?", parsed.path):
            raise ValueError("无效的 b23.tv 短链接。")
        return "bilibili", f"https://b23.tv{parsed.path}"
    if host in ("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"):
        parts = parsed.path.strip("/").split("/")
        video_id = (parts[0] if host.endswith("youtu.be") else
                    parts[1] if len(parts) > 1 and parts[0] in ("shorts", "live", "embed") else
                    query.get("v", [""])[0])
        if re.fullmatch(r"[a-zA-Z0-9_-]{11}", video_id):
            return "youtube", f"https://www.youtube.com/watch?v={video_id}"
    raise ValueError("仅支持单个 B 站/YouTube 视频；请先选择具体视频。")


def detect_browsers(home=None, system=None, env=None):
    home = Path(home) if home else Path.home()
    system = system or sys.platform
    env = os.environ if env is None else env
    if system == "darwin":
        base = home / "Library/Application Support"
        roots = {"edge": [base / "Microsoft Edge"], "chrome": [base / "Google/Chrome"], "firefox": [base / "Firefox/Profiles"]}
    elif system == "win32":
        local = Path(env.get("LOCALAPPDATA", home / "AppData/Local"))
        roaming = Path(env.get("APPDATA", home / "AppData/Roaming"))
        roots = {"edge": [local / "Microsoft/Edge/User Data"], "chrome": [local / "Google/Chrome/User Data"], "firefox": [roaming / "Mozilla/Firefox/Profiles"]}
    else:
        base = Path(env.get("XDG_CONFIG_HOME", home / ".config"))
        roots = {"edge": [base / "microsoft-edge"], "chrome": [base / "google-chrome"], "firefox": [home / ".mozilla/firefox", home / "snap/firefox/common/.mozilla/firefox", home / ".var/app/org.mozilla.firefox/.mozilla/firefox"]}
    found = []
    for name, paths in roots.items():
        for index, path in enumerate(paths):
            if path.is_dir():
                found.append(f"{name}:{path}" if index > 0 else name)
                break
    return found


def redact(text):
    text = re.sub(r"(?im)^.*(?:cookie:|authorization:|set-cookie:).*$", "[credential header omitted]", text)
    text = re.sub(r"(?i)\b(SESSDATA|bili_jct|access_token|refresh_token|token|password)\s*[=:]\s*[^\s;,]+", r"\1=[redacted]", text)
    text = re.sub(r"https?://[^\s\"<>]+", "[URL omitted]", text)
    return text.replace(str(Path.home()), "~")[-1800:]


def classify_error(text):
    low = text.lower()
    checks = [
        ("rate_limited", ("429", "too many requests")),
        ("certificate", ("certificate_verify_failed", "certificate verify failed")),
        ("cookie_access", ("decrypt", "dpapi", "keychain", "cookie database", "cookies database", "cookie file", "keyring", "failed to load cookies")),
        ("restricted", ("not available in your country", "geo-restricted", "members-only", "premium-only", "private video", "video unavailable", "会员", "地区限制")),
        ("login_required", ("login required", "sign in", "log in", "login to", "please login", "登录")),
        ("http_412", ("412", "precondition failed")),
        ("http_403", ("403", "forbidden")),
        ("tool_version", ("no such option", "unrecognized arguments", "unsupported python")),
        ("format_unavailable", ("requested format is not available", "no video formats", "no formats found")),
        ("network", ("timed out", "timeout", "connection reset", "unable to connect", "name resolution", "remote end closed", "tls", "ssl")),
    ]
    return next((code for code, needles in checks if any(x in low for x in needles)), "unknown")


def run_process(command, timeout):
    # Killing the process group also stops ffmpeg after a timeout/interruption.
    with subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          text=True, encoding="utf-8", errors="replace",
                          env=dict(os.environ, PYTHONIOENCODING="utf-8"),
                          start_new_session=os.name != "nt") as process:
        try:
            stdout, stderr = process.communicate(timeout=timeout)
        except (subprocess.TimeoutExpired, KeyboardInterrupt) as error:
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True)
            else:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            stdout, stderr = process.communicate()
            if isinstance(error, KeyboardInterrupt):
                raise
            return subprocess.CompletedProcess(command, 124, stdout, stderr + "\nProcess timed out")
        return subprocess.CompletedProcess(command, process.returncode, stdout, stderr)


def dependencies():
    downloader = shutil.which("yt-dlp")
    command = [downloader] if downloader else ([sys.executable, "-m", "yt_dlp"] if importlib.util.find_spec("yt_dlp") else [])
    result = {"python": sys.version.split()[0], "yt_dlp": None, "ffmpeg": None, "ffprobe": None}
    for name, cmd in (("yt_dlp", command + ["--version"] if command else []),
                      ("ffmpeg", [shutil.which("ffmpeg"), "-version"]),
                      ("ffprobe", [shutil.which("ffprobe"), "-version"])):
        if cmd and cmd[0]:
            p = run_process(cmd, 15)
            if p.returncode == 0 and p.stdout.strip():
                result[name] = p.stdout.strip().splitlines()[0]
    return command if result["yt_dlp"] else [], result


def metadata_summary(info):
    if info.get("_type") in ("playlist", "multi_video"):
        raise ValueError("来源返回多个视频；请提供明确的单视频或分 P 链接。")
    if not info.get("id") or not info.get("title"):
        raise ValueError("来源缺少视频 ID 或标题。")
    formats = info.get("formats") or []
    return {
        "id": info["id"], "title": info["title"], "uploader": info.get("uploader"),
        "description": info.get("description"), "duration_seconds": info.get("duration"),
        "chapters": [{k: c.get(k) for k in ("title", "start_time", "end_time")} for c in info.get("chapters") or []],
        "subtitles": sorted((info.get("subtitles") or {}).keys()),
        "automatic_captions": sorted((info.get("automatic_captions") or {}).keys()),
        "formats": [{k: f.get(k) for k in ("format_id", "ext", "height", "vcodec", "acodec")} for f in formats],
    }


def base_command(command, platform, auth, args):
    cmd = command + ["--ignore-config", "--no-playlist", "--playlist-items", "1", "--no-progress", "--no-colors",
                     "--socket-timeout", "20", "--retries", "1", "--fragment-retries", "1", "--extractor-retries", "0"]
    if platform == "bilibili":
        cmd += ["--referer", "https://www.bilibili.com/"]
    if args.user_agent:
        cmd += ["--user-agent", args.user_agent]
    if auth[0] == "browser":
        cmd += ["--cookies-from-browser", auth[1]]
    elif auth[0] == "cookies_file":
        cmd += ["--cookies", auth[1]]
    return cmd


def action_command(base, args, url, stage):
    # Use a fixed safe basename; titles never become shell commands or paths.
    cmd = base + ["--no-overwrites", "-o", str(stage / "source.%(ext)s")]
    if args.action == "subtitles":
        cmd += ["--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", args.sub_langs,
                "--sub-format", "srt/vtt/ass/best", "--convert-subs", "srt"]
    elif args.action == "audio":
        cmd += ["-f", "ba/b", "-x", "--audio-format", "m4a"]
    else:
        cmd += ["-f", f"bv*[height<={args.max_height}]+ba/b[height<={args.max_height}]",
                "-S", "vcodec:h264,acodec:aac", "--merge-output-format", "mp4", "--write-thumbnail"]
        if args.section:
            cmd += ["--download-sections", "*" + args.section.replace(":", "-")]
    return cmd + [url]


def validate_files(stage, action):
    media_extensions = {".mp4", ".mkv", ".webm", ".m4a", ".mp3", ".opus", ".ogg", ".flv", ".mov"}
    candidates = sorted(p for p in stage.iterdir() if p.is_file() and p.stat().st_size > 0)
    if action == "subtitles":
        subtitles = [p for p in candidates if p.suffix == ".srt" and re.search(r"\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+", p.read_text(encoding="utf-8-sig", errors="replace"))]
        return subtitles, {"subtitle_timing_present": bool(subtitles), "coverage_checked": False}
    media = [p for p in candidates if p.suffix in media_extensions and not re.search(r"\.f[\w-]+\.", p.name)]
    for path in media:
        p = run_process(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name", "-of", "json", str(path)], 30)
        try:
            info = json.loads(p.stdout)
            types = {s.get("codec_type") for s in info.get("streams", [])}
            duration = float(info.get("format", {}).get("duration", 0))
            needed = {"audio"} if action == "audio" else {"video"}
            if p.returncode == 0 and duration > 0 and needed <= types:
                extras = [x for x in candidates if x.suffix in (".jpg", ".png", ".webp")]
                return [path] + extras, {"duration_seconds": duration, "streams": info["streams"], "container_readable": True}
        except (ValueError, TypeError):
            continue
    return [], {"container_readable": False}


def acquire(args, report, command):
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    providers = [("anonymous", "")]
    if args.browser:
        detected = detect_browsers() if args.browser == "auto" else [args.browser]
        report["browser_candidates"] = [x.split(":")[0] for x in detected]
        providers += [("browser", x) for x in detected]
        if not detected:
            report["environment_hint"] = "未找到可读取的本机浏览器配置。若当前工具在云端运行，请在已登录浏览器的电脑运行本脚本，或提供本地视频/音频/字幕。"
    last_code = "unknown"
    with tempfile.TemporaryDirectory(prefix="video-study-auth-") as secret_dir:
        if args.cookies_file:
            original = Path(args.cookies_file).expanduser().resolve()
            header = original.read_text(encoding="utf-8-sig", errors="replace").splitlines()
            if not header or header[0] not in ("# Netscape HTTP Cookie File", "# HTTP Cookie File"):
                raise ValueError("Cookie 文件必须使用 Netscape 格式。")
            # yt-dlp can write its cookie jar on exit. Never mutate the user's jar.
            copied = Path(secret_dir) / "cookies.txt"
            shutil.copyfile(original, copied)
            copied.chmod(0o600)
            providers += [("cookies_file", str(copied))]
        for auth in providers:
            auth_name = auth[0] + (":" + auth[1].split(":")[0] if auth[0] == "browser" else "")
            for refresh in range(2):
                if report["attempts"]:
                    time.sleep(args.retry_delay)
                print(f"[{auth_name}] {args.action}: 解析原始页面" + ("（刷新地址）" if refresh else ""), file=sys.stderr, flush=True)
                base = base_command(command, report["platform"], auth, args)
                p = run_process(base + ["--skip-download", "--dump-single-json", report["canonical_url"]], args.probe_timeout)
                event = {"auth": auth_name, "refresh": refresh, "stage": "metadata", "returncode": p.returncode}
                if p.returncode == 0:
                    try:
                        info = json.loads(p.stdout)
                        report["metadata"] = metadata_summary(info)
                    except (ValueError, TypeError) as error:
                        event.update(code="metadata_invalid", error=redact(str(error)))
                        report["attempts"].append(event)
                        return "metadata_invalid"
                    if args.action == "probe":
                        event["code"] = "ok"
                        report["attempts"].append(event)
                        report["selected_auth"] = auth_name
                        report["status"] = "metadata_ready"
                        return None
                    with tempfile.TemporaryDirectory(prefix=".acquire-", dir=output) as stage_dir:
                        stage = Path(stage_dir)
                        event.update(stage=args.action)
                        print(f"[{auth_name}] 获取{args.action}源文件", file=sys.stderr, flush=True)
                        p = run_process(action_command(base, args, report["canonical_url"], stage), args.download_timeout)
                        event["returncode"] = p.returncode
                        if p.returncode == 0:
                            files, validation = validate_files(stage, args.action)
                            if args.action == "video" and any(f.get("acodec") not in (None, "none") for f in info.get("formats", [])):
                                validation["expected_audio_present"] = any(s.get("codec_type") == "audio" for s in validation.get("streams", []))
                                if not validation["expected_audio_present"]:
                                    files = []
                            expected = report["metadata"].get("duration_seconds")
                            if args.action in ("video", "audio") and not args.section and expected:
                                actual = validation.get("duration_seconds", 0)
                                validation["duration_matches_source"] = abs(actual - expected) <= max(3, expected * 0.02)
                                if not validation["duration_matches_source"]:
                                    files = []
                            event["validation"] = validation
                            if files:
                                # Unique target prevents changing earlier source assets.
                                target = output / ("acquired-" + report["run_id"])
                                target.mkdir(exist_ok=True)
                                for file in files:
                                    destination = target / file.name
                                    shutil.move(str(file), destination)
                                    report["artifacts"].append(str(destination.relative_to(output)))
                                event["code"] = "ok"
                                report["attempts"].append(event)
                                report.update(status="source_ready", selected_auth=auth_name, validation=validation)
                                report["full_video_downloaded"] = args.action == "video" and not args.section
                                return None
                            event["code"] = "no_subtitles" if args.action == "subtitles" else "artifact_invalid"
                last_code = event.get("code") or classify_error(p.stderr)
                event.update(code=last_code, error=redact(p.stderr))
                report["attempts"].append(event)
                if last_code in ("rate_limited", "certificate", "tool_version"):
                    return last_code
                if last_code in ("http_403", "network") and refresh == 0:
                    continue
                break
    return last_code


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", nargs="?")
    parser.add_argument("--output", default="video-source", help="Source directory; previous media is never overwritten")
    parser.add_argument("--action", choices=("probe", "video", "audio", "subtitles"), default="probe")
    auth = parser.add_mutually_exclusive_group()
    auth.add_argument("--browser", help="Opt in to local cookies: auto, edge, chrome, firefox, or browser:profile")
    auth.add_argument("--cookies-file", help="Local Netscape cookie file; never exported or modified")
    parser.add_argument("--doctor", action="store_true", help="Check local tools/profiles without network or reading cookies")
    parser.add_argument("--user-agent", help="Optional browser User-Agent for sites requiring matching headers")
    parser.add_argument("--max-height", type=int, default=720)
    parser.add_argument("--sub-langs", default="zh.*,en.*,ai-zh,ai-en")
    parser.add_argument("--section", help="Video-only sample interval in seconds, e.g. 10:18; never marked full video")
    parser.add_argument("--probe-timeout", type=int, default=90)
    parser.add_argument("--download-timeout", type=int, default=1800)
    parser.add_argument("--retry-delay", type=float, default=3)
    args = parser.parse_args(argv)
    if not args.doctor and not args.url:
        parser.error("需要视频链接，或使用 --doctor 检查环境。")
    if args.browser and args.browser.split(":")[0] not in ("auto", "edge", "chrome", "firefox", "chromium", "brave", "safari", "opera", "vivaldi"):
        parser.error("浏览器名称不受支持。")
    if args.browser and args.browser.startswith("auto:"):
        parser.error("auto 不接受配置路径；请指定具体浏览器。")
    if min(args.max_height, args.probe_timeout, args.download_timeout) <= 0 or args.retry_delay < 0:
        parser.error("画质和超时必须为正数，重试间隔不得为负数。")
    if args.section:
        match = re.fullmatch(r"(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)", args.section)
        if args.action != "video" or not match or float(match[1]) >= float(match[2]):
            parser.error("--section 仅适用于 video，格式为起始秒:结束秒且结束大于起始。")
    return args


def main(argv=None):
    args = parse_args(argv)
    report = {"schema": "video-source-acquisition@1", "run_id": uuid.uuid4().hex[:12],
              "created_at": dt.datetime.now(dt.timezone.utc).isoformat(), "action": args.action,
              "status": "failed", "attempts": [], "artifacts": [], "full_video_downloaded": False,
              "section_seconds": args.section}
    output = Path(args.output).expanduser().resolve()
    try:
        command, report["dependencies"] = dependencies()
        if args.doctor:
            report.update(status="environment_checked", browser_profiles=detect_browsers(),
                          note="浏览器目录存在不代表已登录或 Cookie 可解密；未读取 Cookie、未访问网站。")
            code = 0 if command else 2
        else:
            report["platform"], report["canonical_url"] = normalize_url(args.url)
            missing = [k for k in (("yt_dlp",) if args.action == "probe" else ("yt_dlp", "ffmpeg", "ffprobe")) if not report["dependencies"][k]]
            if missing:
                report.update(error_code="missing_dependency", missing_dependencies=missing,
                              hint="请在实际执行脚本的机器安装缺失工具并加入 PATH；安装 Skill 不会自动安装这些程序。参见 references/source-acquisition.md。")
                code = 2
            else:
                error = acquire(args, report, command)
                if error:
                    report.update(error_code=error, hint=HINTS.get(error, HINTS["unknown"]))
                    if error == "no_subtitles":
                        report["status"] = "needs_asr"
                code = 0 if error is None else 3
    except KeyboardInterrupt:
        report.update(status="interrupted", hint="用户中断，本次未完成。")
        code = 130
    except (OSError, ValueError) as error:
        report.update(error_code="local_configuration", error=redact(str(error)))
        code = 2
    output.mkdir(parents=True, exist_ok=True)
    path = output / ("acquisition-report-" + report["run_id"] + ".json")
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "report": str(path), "error_code": report.get("error_code"),
                      "hint": report.get("hint"), "environment_hint": report.get("environment_hint"), "artifacts": report["artifacts"]}, ensure_ascii=False, indent=2))
    return code


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(main())
