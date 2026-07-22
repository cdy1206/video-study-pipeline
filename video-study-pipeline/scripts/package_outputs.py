#!/usr/bin/env python3
"""Package video study outputs into the standard Downloads layout."""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path


DEFAULT_ROOT = Path.home() / "Downloads" / "视频解读"
UNSAFE_CHARS = r'/\\:*?"<>|'


def safe_name(value: str, max_len: int = 80) -> str:
    value = "".join(ch for ch in value if ch >= " " and ch not in UNSAFE_CHARS)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"[.。]{2,}", "。", value)
    value = value.strip(" .")
    if not value:
        value = "untitled-video"
    if len(value) > max_len:
        value = value[:max_len].rstrip(" -_，,。.")
    return value or "untitled-video"


def copy_file(src: Path, dst: Path, overwrite: bool) -> None:
    if not src.exists():
        raise FileNotFoundError(f"Missing source file: {src}")
    if dst.exists() and not overwrite:
        raise FileExistsError(f"Destination exists: {dst} (use --overwrite)")
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def copy_tree(src: Path, dst: Path, overwrite: bool) -> None:
    if not src.exists():
        raise FileNotFoundError(f"Missing source directory: {src}")
    if not src.is_dir():
        raise NotADirectoryError(f"Presentation path must be a directory: {src}")
    if dst.exists():
        if not overwrite:
            raise FileExistsError(f"Destination exists: {dst} (use --overwrite)")
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dst)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", required=True, help="Video title used for output filenames.")
    parser.add_argument("--video-id", default="", help="BVID, YouTube id, or another stable id.")
    parser.add_argument("--html", type=Path, help="Path to final HTML output.")
    parser.add_argument("--pdf", type=Path, help="Path to final PDF output.")
    parser.add_argument("--tex", type=Path, help="Path to final LaTeX source for a PDF lecture note.")
    parser.add_argument("--deep-note", type=Path, help="Path to the shared deep_note.md content base.")
    parser.add_argument("--subtitle", type=Path, help="Path to final timestamped SRT/VTT transcript.")
    parser.add_argument("--asset-manifest", type=Path, help="Path to assets/asset_manifest.json or .md.")
    parser.add_argument("--asset-dir", type=Path, help="Path to the reviewed article/PDF asset directory.")
    parser.add_argument("--renderer-report", type=Path, help="Path to renderer_report.json.")
    parser.add_argument("--official-alignment-report", type=Path, help="Path to official_alignment_report.json.")
    parser.add_argument("--review-file", type=Path, action="append", default=[], help="Path to a visual review file to copy under review/. May be repeated.")
    parser.add_argument("--presentation", type=Path, help="Path to runnable presentation project directory.")
    parser.add_argument("--presentation-html", type=Path, help="Path to flattened presentation HTML export.")
    parser.add_argument("--out-root", type=Path, default=DEFAULT_ROOT, help="Output root directory.")
    parser.add_argument("--source-url", default="", help="Original video URL for metadata.json.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing packaged files.")
    parser.add_argument("--dry-run", action="store_true", help="Print target paths without copying.")
    args = parser.parse_args()

    if not any(
        [
            args.html,
            args.pdf,
            args.tex,
            args.deep_note,
            args.subtitle,
            args.asset_manifest,
            args.asset_dir,
            args.renderer_report,
            args.official_alignment_report,
            *args.review_file,
            args.presentation,
            args.presentation_html,
        ]
    ):
        parser.error(
            "Provide at least one output: --html, --pdf, --tex, --deep-note, "
            "--subtitle, --asset-manifest, --asset-dir, --renderer-report, "
            "--official-alignment-report, --review-file, --presentation, or --presentation-html."
        )

    title = safe_name(args.title)
    video_id = safe_name(args.video_id, max_len=40) if args.video_id else ""
    folder_name = f"{video_id}-{title}" if video_id else title
    out_dir = args.out_root / folder_name

    outputs: dict[str, str] = {}
    planned: list[tuple[Path, Path]] = []
    if args.html:
        dst = out_dir / f"{title}.html"
        planned.append((args.html, dst))
        outputs["html"] = str(dst)
    if args.pdf:
        dst = out_dir / f"{title}.pdf"
        planned.append((args.pdf, dst))
        outputs["pdf"] = str(dst)
    if args.tex:
        dst = out_dir / f"{title}.tex"
        planned.append((args.tex, dst))
        outputs["tex"] = str(dst)
    if args.deep_note:
        dst = out_dir / "deep_note.md"
        planned.append((args.deep_note, dst))
        outputs["deep_note"] = str(dst)
    if args.subtitle:
        dst = out_dir / f"transcript_final{args.subtitle.suffix}"
        planned.append((args.subtitle, dst))
        outputs["subtitle"] = str(dst)
    if args.renderer_report:
        dst = out_dir / "renderer_report.json"
        planned.append((args.renderer_report, dst))
        outputs["renderer_report"] = str(dst)
    if args.official_alignment_report:
        dst = out_dir / "official_alignment_report.json"
        planned.append((args.official_alignment_report, dst))
        outputs["official_alignment_report"] = str(dst)
    planned_dirs: list[tuple[Path, Path]] = []
    if args.asset_dir:
        dst = out_dir / "assets"
        planned_dirs.append((args.asset_dir, dst))
        outputs["asset_dir"] = str(dst)
    if args.asset_manifest:
        suffix = args.asset_manifest.suffix or ".json"
        dst = out_dir / "assets" / f"asset_manifest{suffix}"
        planned.append((args.asset_manifest, dst))
        outputs["asset_manifest"] = str(dst)
    if args.presentation:
        dst = out_dir / "presentation"
        planned_dirs.append((args.presentation, dst))
        outputs["presentation"] = str(dst)
    if args.presentation_html:
        dst = out_dir / f"{title}-presentation.html"
        planned.append((args.presentation_html, dst))
        outputs["presentation_html"] = str(dst)
    for review_file in args.review_file:
        dst = out_dir / "review" / review_file.name
        planned.append((review_file, dst))
        outputs.setdefault("review_files", []).append(str(dst))

    metadata = {
        "title": args.title,
        "safe_title": title,
        "video_id": args.video_id,
        "source_url": args.source_url,
        "outputs": outputs,
    }

    if args.dry_run:
        print(json.dumps({"out_dir": str(out_dir), "planned": outputs}, ensure_ascii=False, indent=2))
        return 0

    out_dir.mkdir(parents=True, exist_ok=True)
    for src, dst in planned_dirs:
        copy_tree(src, dst, args.overwrite)
    for src, dst in planned:
        copy_file(src, dst, args.overwrite)

    meta_path = out_dir / "metadata.json"
    if meta_path.exists() and not args.overwrite:
        raise FileExistsError(f"Destination exists: {meta_path} (use --overwrite)")
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"out_dir": str(out_dir), "outputs": outputs, "metadata": str(meta_path)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
