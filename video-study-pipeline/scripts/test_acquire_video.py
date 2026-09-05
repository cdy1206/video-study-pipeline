"""Tests for source acquisition boundaries; no real credentials or network."""

import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import acquire_video as av


URL = "https://www.bilibili.com/video/BV1jxte6hEf1"
INFO = {"id": "BV1jxte6hEf1", "title": "Test video", "duration": 12,
        "formats": [{"format_id": "1", "url": "https://cdn.invalid/?secret=hidden", "http_headers": {"Cookie": "secret"}}]}


def completed(cmd, code=0, out="", err=""):
    return subprocess.CompletedProcess(cmd, code, out, err)


class AcquisitionTests(unittest.TestCase):
    def args(self, output, *extra):
        return av.parse_args([URL, "--output", str(output), "--retry-delay", "0", *extra])

    def report(self):
        return {"run_id": "test", "canonical_url": URL, "platform": "bilibili", "attempts": [], "artifacts": []}

    def test_normalizes_watchlater_and_retains_part(self):
        platform, url = av.normalize_url("https://www.bilibili.com/list/watchlater/?bvid=BV1jxte6hEf1\\&p=2\\&spm_id_from=tracker")
        self.assertEqual((platform, url), ("bilibili", URL + "?p=2"))
        self.assertEqual(av.normalize_url("BV1jxte6hEf1")[1], URL)

    def test_youtube_and_short_urls(self):
        self.assertEqual(av.normalize_url("https://youtu.be/s06mSAGN4gM?t=300"), ("youtube", "https://www.youtube.com/watch?v=s06mSAGN4gM"))
        self.assertEqual(av.normalize_url("https://www.youtube.com/shorts/s06mSAGN4gM")[1], "https://www.youtube.com/watch?v=s06mSAGN4gM")
        self.assertEqual(av.normalize_url("https://b23.tv/Example?tracking=1")[1], "https://b23.tv/Example")

    def test_rejects_ambiguous_or_foreign_inputs(self):
        for value in ("https://evil.example/BV1jxte6hEf1", "file:///tmp/a", "https://bilibili.com.evil.example/?bvid=BV1jxte6hEf1", URL + "?p=0", "https://youtube.com/playlist?list=foo"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                av.normalize_url(value)

    def test_browser_detection_across_platforms(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp)
            for system, folder, browser in (("darwin", "Library/Application Support/Microsoft Edge", "edge"), ("win32", "AppData/Local/Google/Chrome/User Data", "chrome"), ("linux", ".mozilla/firefox", "firefox")):
                (home / folder).mkdir(parents=True)
                self.assertIn(browser, av.detect_browsers(home, system, {}))

    def test_reports_omit_signed_urls_and_secrets(self):
        summary = json.dumps(av.metadata_summary(INFO))
        self.assertNotIn("hidden", summary)
        self.assertNotIn("http_headers", summary)
        error = av.redact("HTTP Error 403 https://cdn.invalid/?auth=secret\nCookie: SESSDATA=secret\nSESSDATA=secret")
        self.assertNotIn("=secret", error)
        self.assertNotIn("cdn.invalid", error)

    def test_flatpak_firefox_passes_the_detected_profile_path(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / ".var/app/org.mozilla.firefox/.mozilla/firefox"
            path.mkdir(parents=True)
            self.assertEqual(av.detect_browsers(temp, "linux", {}), [f"firefox:{path}"])

    def test_classification_does_not_call_every_403_cloudflare(self):
        for message, category in (("HTTP Error 403: Forbidden", "http_403"), ("HTTP Error 412", "http_412"), ("HTTP Error 429", "rate_limited"), ("failed to decrypt with DPAPI", "cookie_access"), ("CERTIFICATE_VERIFY_FAILED", "certificate")):
            self.assertEqual(av.classify_error(message), category)

    def test_anonymous_failure_then_authorized_edge_success(self):
        calls = []
        def runner(cmd, timeout):
            calls.append(cmd)
            return completed(cmd, out=json.dumps(INFO)) if "--cookies-from-browser" in cmd else completed(cmd, 1, err="HTTP Error 412")
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            report = self.report()
            self.assertIsNone(av.acquire(self.args(temp, "--browser", "edge"), report, ["yt-dlp"]))
            self.assertEqual(report["selected_auth"], "browser:edge")
            self.assertEqual(len(calls), 2)
            self.assertEqual(report["status"], "metadata_ready")
            self.assertFalse(report["artifacts"])

    def test_no_implicit_browser_access(self):
        calls = []
        def runner(cmd, timeout):
            calls.append(cmd)
            return completed(cmd, 1, err="HTTP Error 412")
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner), patch.object(av, "detect_browsers", return_value=["edge"]):
            self.assertEqual(av.acquire(self.args(temp), self.report(), ["yt-dlp"]), "http_412")
            self.assertEqual(len(calls), 1)
            self.assertNotIn("--cookies-from-browser", calls[0])

    def test_media_403_reextracts_original_page_and_is_bounded(self):
        calls = []
        def runner(cmd, timeout):
            calls.append(cmd)
            if "--dump-single-json" in cmd:
                return completed(cmd, out=json.dumps(INFO))
            return completed(cmd, 1, err="HTTP Error 403 https://cdn.invalid/?secret=hidden")
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            report = self.report()
            self.assertEqual(av.acquire(self.args(temp, "--action", "video"), report, ["yt-dlp"]), "http_403")
            self.assertEqual(len(calls), 4)
            self.assertTrue(all(cmd[-1] == URL for cmd in calls))
            self.assertTrue(all("--load-info-json" not in cmd for cmd in calls))
            self.assertNotIn("hidden", json.dumps(report))

    def test_rate_limit_stops_before_browser_fallback(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", return_value=completed([], 1, err="HTTP Error 429")) as run:
            self.assertEqual(av.acquire(self.args(temp, "--browser", "edge"), self.report(), ["yt-dlp"]), "rate_limited")
            self.assertEqual(run.call_count, 1)

    def test_empty_subtitles_not_mistaken_for_success(self):
        def runner(cmd, timeout):
            return completed(cmd, out=json.dumps(INFO) if "--dump-single-json" in cmd else "")
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            (Path(temp) / "old.srt").write_text("1\n00:00:00,000 --> 00:00:01,000\nold\n")
            report = self.report()
            self.assertEqual(av.acquire(self.args(temp, "--action", "subtitles"), report, ["yt-dlp"]), "no_subtitles")
            self.assertFalse(report["artifacts"])
            self.assertTrue((Path(temp) / "old.srt").exists())

    def test_cookie_file_is_copied_not_modified(self):
        captured = []
        def runner(cmd, timeout):
            if "--cookies" in cmd:
                path = Path(cmd[cmd.index("--cookies") + 1])
                captured.append(path)
                path.write_text("simulated yt-dlp cookie jar writeback")
                return completed(cmd, out=json.dumps(INFO))
            return completed(cmd, 1, err="HTTP Error 412")
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            cookie = Path(temp) / "user-cookies.txt"
            content = "# Netscape HTTP Cookie File\n"
            cookie.write_text(content)
            report = self.report()
            self.assertIsNone(av.acquire(self.args(temp, "--cookies-file", str(cookie)), report, ["yt-dlp"]))
            self.assertEqual(cookie.read_text(), content)
            self.assertTrue(captured)
            self.assertFalse(captured[0].exists())
            self.assertNotIn(str(cookie), json.dumps(report))

    def test_clip_is_never_reported_as_full_video(self):
        def runner(cmd, timeout):
            if "--dump-single-json" in cmd:
                return completed(cmd, out=json.dumps(INFO))
            if cmd[0] == "ffprobe":
                return completed(cmd, out=json.dumps({"format": {"duration": "3"}, "streams": [{"codec_type": "video", "codec_name": "h264"}]}))
            (Path(cmd[cmd.index("-o") + 1]).parent / "source.mp4").write_bytes(b"test fixture")
            self.assertIn("*1-4", cmd)
            return completed(cmd)
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            report = self.report()
            self.assertIsNone(av.acquire(self.args(temp, "--action", "video", "--section", "1:4"), report, ["yt-dlp"]))
            self.assertFalse(report["full_video_downloaded"])
            self.assertEqual(len(report["artifacts"]), 1)

    def test_truncated_media_does_not_pass_full_download(self):
        def runner(cmd, timeout):
            if "--dump-single-json" in cmd:
                return completed(cmd, out=json.dumps(INFO))
            if cmd[0] == "ffprobe":
                return completed(cmd, out=json.dumps({"format": {"duration": "2"}, "streams": [{"codec_type": "video"}]}))
            (Path(cmd[cmd.index("-o") + 1]).parent / "source.mp4").write_bytes(b"partial")
            return completed(cmd)
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            self.assertEqual(av.acquire(self.args(temp, "--action", "video"), self.report(), ["yt-dlp"]), "artifact_invalid")

    def test_silent_result_rejected_when_source_has_audio(self):
        info = dict(INFO, formats=[{"acodec": "aac"}])
        def runner(cmd, timeout):
            if "--dump-single-json" in cmd:
                return completed(cmd, out=json.dumps(info))
            if cmd[0] == "ffprobe":
                return completed(cmd, out=json.dumps({"format": {"duration": "12"}, "streams": [{"codec_type": "video"}]}))
            (Path(cmd[cmd.index("-o") + 1]).parent / "source.mp4").write_bytes(b"silent fixture")
            return completed(cmd)
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "run_process", runner):
            report = self.report()
            self.assertEqual(av.acquire(self.args(temp, "--action", "video"), report, ["yt-dlp"]), "artifact_invalid")
            self.assertFalse(report["attempts"][-1]["validation"]["expected_audio_present"])

    def test_cloud_profile_absence_has_actionable_hint(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "detect_browsers", return_value=[]), patch.object(av, "run_process", return_value=completed([], 1, err="HTTP Error 412")) as run:
            report = self.report()
            self.assertEqual(av.acquire(self.args(temp, "--browser", "auto"), report, ["yt-dlp"]), "http_412")
            self.assertIn("云端", report["environment_hint"])
            self.assertEqual(run.call_count, 1)

    def test_missing_tools_report_without_network(self):
        deps = {"python": "3.11", "yt_dlp": None, "ffmpeg": None, "ffprobe": None}
        with tempfile.TemporaryDirectory() as temp, patch.object(av, "dependencies", return_value=([], deps)), patch.object(av, "run_process") as run, patch("builtins.print"):
            self.assertEqual(av.main([URL, "--output", temp]), 2)
            report = json.loads(next(Path(temp).glob("acquisition-report-*.json")).read_text())
            self.assertEqual(report["error_code"], "missing_dependency")
            self.assertFalse(report["attempts"])
            run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
