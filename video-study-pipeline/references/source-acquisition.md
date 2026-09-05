# 视频来源获取

先运行随 Skill 一起安装的 `scripts/acquire_video.py`。它支持 B 站和 YouTube 的单视频链接、BV 号、B 站稍后再看、b23.tv、YouTube 短链接；保留 B 站 `p=2` 等分 P 参数。合集仍需先确定具体视频或分 P，一次调用只处理一个。

## 安装环境

脚本使用 Python 3.9+ 标准库，调用实际执行机器上的 `yt-dlp`。媒体和字幕转换需要 `ffmpeg`、`ffprobe`。安装 Skill 只安装指令与脚本，不会自动安装下载工具或取得网站登录态。

macOS（已安装 Homebrew）：

```bash
brew install yt-dlp ffmpeg
```

Windows PowerShell（已安装 Python 和 winget）：

```powershell
winget install --id yt-dlp.yt-dlp -e
winget install --id Gyan.FFmpeg -e
```

Linux / Python 虚拟环境：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -U "yt-dlp[default]"
```

再使用系统包管理器安装 `ffmpeg`（例如 Ubuntu/Debian 的 `sudo apt install ffmpeg`）。安装后重新打开终端，确保工具已加入 PATH。脚本也支持当前 Python 环境中的 `python -m yt_dlp`。

更新时使用原安装方式：Homebrew 的 `brew upgrade yt-dlp`、winget 的 `winget upgrade --id yt-dlp.yt-dlp -e`，或虚拟环境中的 `python -m pip install -U "yt-dlp[default]"`。脚本记录实际工具版本，不在任务中自动升级依赖。

## 标准调用

以下命令在安装后的 `video-study-pipeline/` 目录执行；也可以把脚本路径换成绝对路径。Windows 可将 `python3` 换为 `py`，并把命令写成一行。

先检查环境（无网络请求，不读取 Cookie，只检查浏览器配置目录是否存在）：

```bash
python3 scripts/acquire_video.py --doctor --output ./source-check
```

匿名读取元数据，不下载媒体：

```bash
python3 scripts/acquire_video.py "<video-url>" --action probe --output "<run-dir>/assets/source"
```

用户授权使用本机 Edge 登录态后：

```bash
python3 scripts/acquire_video.py "<video-url>" --browser edge --action probe --output "<run-dir>/assets/source"
python3 scripts/acquire_video.py "<video-url>" --browser edge --action subtitles --output "<run-dir>/assets/source"
python3 scripts/acquire_video.py "<video-url>" --browser edge --action video --output "<run-dir>/assets/source"
```

`--browser chrome`、`--browser firefox` 指定其他浏览器。`--browser 'chrome:Profile 1'` 可指定 yt-dlp 支持的配置名称或路径。`--browser auto` 表示用户已允许尝试本机 Edge、Chrome、Firefox 中检测到的配置目录（按此顺序，最多三个）；它不证明这些浏览器已经登录。应优先使用用户实际看视频的浏览器。

所有模式先匿名尝试。失败后才使用显式指定的凭据来源；字幕模式匿名返回空字幕时也会尝试该来源。成功后立即停止。B 站添加来源页请求头（Referer），其余请求头交由 yt-dlp 的平台提取器处理。需要浏览器一致标识时，可添加 `--user-agent '<当前浏览器的完整 User-Agent>'`。

仅当字幕缺失/不可用时获取音频，随后调用已配置的 ASR：

```bash
python3 scripts/acquire_video.py "<video-url>" --browser edge --action audio --output "<run-dir>/assets/source"
```

`video` 默认选择不高于 720p 的视频并优先 H.264/AAC；可用 `--max-height 1080` 调整。最终容器/编码要以报告为准。HTML 播放仍需单独验收音频、编码兼容性和交互。

做短片下载验证时可选 `--action video --section 10:18`，表示第 10 至 18 秒。切点可能靠近关键帧，片段不能作为完整转写或完整视频的替代品，报告中的 `full_video_downloaded` 一定为 `false`。

## Cookie 与执行位置

- 使用 `--browser` 即明确选择读取该本地登录态。Skill 应复用会话中已有的浏览器授权，无需每次重复询问；新的用户/电脑首次使用需要说明并确认使用哪个浏览器。
- 默认没有 Cookie 读取，也没有 Cookie 导出。macOS 可能出现系统钥匙串提示；Windows Chromium 的加密或数据库占用可能阻止读取，这并非“未安装 Skill”。操作系统限制无法靠提示词解除。
- 如果浏览器读取确实不可用，可传入 `--cookies-file '/local/path/cookies.txt'`。文件须为 Netscape 格式。脚本使用临时副本，避免 yt-dlp 写回原文件；结束后删除临时副本。
- 不把 Cookie、登录信息或签名播放地址写到报告、GitHub 或学习成品中。不建议把整个浏览器 Cookie 导出给 AI；yt-dlp 的浏览器导出可能包含所有网站登录态。
- 豆包、WorkBuddy 或任何其他客户端是否可用，取决于这次任务是否能在**用户本机**运行命令、访问本机浏览器配置以及使用同一网络。不能仅凭客户端名称断言其能力。
- 若任务实际在云端/沙箱运行，浏览器目录不存在或本机文件不可达，应在本机执行上面的命令，把取得的视频/音频/字幕交给该客户端。仅上传 Skill 并不会把本机登录态带进云端。

## 报告和错误处理

每次运行保留独立的 `acquisition-report-<run-id>.json`。成功取得的文件进入 `acquired-<run-id>/`；之前的来源文件和报告不会被覆盖。失败尝试的临时下载目录会被清理。把报告路径和产物相对路径接入现有 `source_manifest.json`，不要重新创建或覆盖整份资产清单。

报告包括平台、规范化 URL、工具版本、尝试阶段、授权来源名称、脱敏错误、元数据摘要、文件路径、媒体验证结果。不会保存可复用的 CDN 签名 URL、请求 Cookie 或完整 yt-dlp 原始 JSON。

| 状态/错误 | 含义与下一步 |
| --- | --- |
| `environment_checked` | 已检查本机工具/浏览器目录，尚未登录或探测视频。检查依赖字段中的空值。 |
| `metadata_ready` | 能读取元数据，不代表视频或字幕已取得。继续所需的获取动作。 |
| `source_ready` | 本次请求的文件已取得并通过基本检查。字幕仍需覆盖检查；视频仍需播放验收。 |
| `needs_asr` / `no_subtitles` | 所选语言字幕未取得，继续音频和 ASR 路线。 |
| `missing_dependency` | 在实际执行机器上安装列出的缺失依赖。 |
| `http_412` | 当前网页/API 请求被拒绝；尝试已授权的本机浏览器登录态。 |
| `http_403` | 访问被拒绝，可能涉及登录态、来源页、地址有效期或网络；不能只看状态码认定原因。 |
| `cookie_access` | Cookie 无法读取/解密；检查配置路径、系统权限、浏览器占用，或使用本地 Cookie 文件。 |
| `login_required` / `restricted` | 检查账号是否有权正常播放。付费、区域、下架或私有内容不能保证获取。 |
| `rate_limited` | 立即停止，不轮换更多浏览器、不提高并发；等待后再试。 |
| `certificate` / `network` | 修复证书或实际执行环境的网络问题。 |
| `artifact_invalid` | 文件缺失、无法读取，或完整媒体时长与源时长明显不符，不能继续当作成功。 |

`403` 或网络错误在同一凭据来源下最多刷新一次，重新调用原始视频 URL。每个 yt-dlp 请求也限制重试；`429`、证书问题、版本不兼容立即停止。默认探测超时 90 秒，单次下载超时 1800 秒，可用 `--probe-timeout` / `--download-timeout` 调整；超时/中断会结束子进程。

退出码：`0` 表示所请求动作完成，`2` 表示本地参数/依赖问题，`3` 表示来源获取未完成（含需要 ASR），`130` 表示用户中断。不能把 `0` 等同于整条解读任务完成。

官方参数参考：[yt-dlp 用法](https://github.com/yt-dlp/yt-dlp#usage-and-options)、[Cookie FAQ](https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp)。
