#!/usr/bin/env python3
"""Create a file://-safe single HTML from a built Vite presentation."""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import re
from pathlib import Path


ASSET_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}


def data_url(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def replace_asset_refs(text: str, assets_dir: Path) -> str:
    if not assets_dir.exists():
        return text
    for asset in sorted(assets_dir.rglob("*")):
        if not asset.is_file() or asset.suffix.lower() not in ASSET_EXTS:
            continue
        rel = asset.relative_to(assets_dir).as_posix()
        embedded = data_url(asset)
        for ref in (f"./assets/{rel}", f"assets/{rel}", f"/assets/{rel}"):
            text = text.replace(ref, embedded)
    return text


def inline_html(dist_dir: Path, out_path: Path, title: str | None) -> dict[str, object]:
    index_path = dist_dir / "index.html"
    if not index_path.exists():
        raise FileNotFoundError(f"Missing built index.html: {index_path}")

    html = index_path.read_text(encoding="utf-8")
    assets_dir = dist_dir / "assets"
    css_files: list[str] = []
    js_files: list[str] = []
    inline_scripts: list[str] = []

    def inline_link(match: re.Match[str]) -> str:
        href = match.group("href")
        if href.startswith(("http://", "https://", "data:")):
            return match.group(0)
        css_path = (dist_dir / href.lstrip("./")).resolve()
        css = replace_asset_refs(css_path.read_text(encoding="utf-8"), assets_dir)
        css = css.replace("</style", "<\\/style")
        css_files.append(str(css_path))
        return f"<style>\n{css}\n</style>"

    def inline_script(match: re.Match[str]) -> str:
        src = match.group("src")
        if src.startswith(("http://", "https://", "data:")):
            return match.group(0)
        js_path = (dist_dir / src.lstrip("./")).resolve()
        js = replace_asset_refs(js_path.read_text(encoding="utf-8"), assets_dir)
        js = js.replace("</script", "<\\/script")
        js_files.append(str(js_path))
        inline_scripts.append(f"<script>\n{js}\n</script>")
        return ""

    html = re.sub(
        r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*href=["\'](?P<href>[^"\']+)["\'][^>]*>',
        inline_link,
        html,
    )
    html = re.sub(
        r'<script\b[^>]*src=["\'](?P<src>[^"\']+)["\'][^>]*>\s*</script>',
        inline_script,
        html,
    )
    html = replace_asset_refs(html, assets_dir)
    if inline_scripts:
        script_block = "\n".join(inline_scripts)
        if "</body>" in html:
            html = html.replace("</body>", f"{script_block}\n  </body>")
        else:
            html += "\n" + script_block + "\n"
    if title:
        html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, flags=re.S)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    return {
        "dist_dir": str(dist_dir),
        "out_path": str(out_path),
        "css_files": css_files,
        "js_files": js_files,
        "bytes": out_path.stat().st_size,
        "has_external_assets": "./assets/" in html or "assets/" in html or "/assets/" in html,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, required=True, help="Built presentation dist directory.")
    parser.add_argument("--out", type=Path, required=True, help="Single HTML output path.")
    parser.add_argument("--title", default="", help="Optional page title override.")
    args = parser.parse_args()

    result = inline_html(args.dist, args.out, args.title or None)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
