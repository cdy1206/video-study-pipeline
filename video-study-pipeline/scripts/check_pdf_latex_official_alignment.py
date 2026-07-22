#!/usr/bin/env python3
"""Check whether a LaTeX PDF note follows official-style video-render rules."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


SECTION_RE = re.compile(r"\\section\{")
SUMMARY_RE = re.compile(r"\\subsection\{本章小结\}")
INCLUDE_RE = re.compile(r"\\includegraphics(?:\[[^\]]*\])?\{(?P<path>[^}]+)\}")
FIGURE_RE = re.compile(r"\\begin\{figure\}(?P<body>.*?)\\end\{figure\}", re.S)
FOOTNOTE_RE = re.compile(r"\\footnotetext\{[^}]*?(?:视频|source|time|时间)[^}]*?\}", re.S | re.I)


def strip_comments(tex: str) -> str:
    lines: list[str] = []
    for line in tex.splitlines():
        escaped = False
        kept: list[str] = []
        for ch in line:
            if ch == "\\" and not escaped:
                escaped = True
                kept.append(ch)
                continue
            if ch == "%" and not escaped:
                break
            kept.append(ch)
            escaped = False
        lines.append("".join(kept))
    return "\n".join(lines)


def load_manifest(path: Path | None) -> dict[str, Any]:
    if path is None:
        return {}
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def inserted_assets(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    assets: list[dict[str, Any]] = []
    for key in ("selected_keyframes", "generated_diagrams", "tables"):
        for item in manifest.get(key, []):
            if item.get("insert"):
                item = dict(item)
                item["_group"] = key
                assets.append(item)
    return assets


def check(tex: str, manifest: dict[str, Any], *, allow_missing_summaries: bool) -> dict[str, Any]:
    tex = strip_comments(tex)
    sections = len(SECTION_RE.findall(tex))
    summaries = len(SUMMARY_RE.findall(tex))
    include_paths = [match.group("path") for match in INCLUDE_RE.finditer(tex)]
    include_basenames = {Path(path).name for path in include_paths}
    figures = list(FIGURE_RE.finditer(tex))
    footnotes = list(FOOTNOTE_RE.finditer(tex))

    assets = inserted_assets(manifest)
    expected_graphics = [
        item
        for item in assets
        if item.get("_group") in {"selected_keyframes", "generated_diagrams"}
        and (item.get("latex_path") or item.get("path"))
    ]
    missing_graphics = [
        item.get("latex_path") or item.get("path")
        for item in expected_graphics
        if Path(str(item.get("latex_path") or item.get("path"))).name not in include_basenames
    ]

    selected_keyframes = [
        item for item in manifest.get("selected_keyframes", []) if item.get("insert")
    ]
    keyframe_missing_footnote = len(footnotes) < len(selected_keyframes)

    required_template_markers = {
        "knowledgebox": "\\newtcolorbox{knowledgebox}" in tex,
        "importantbox": "\\newtcolorbox{importantbox}" in tex,
        "warningbox": "\\newtcolorbox{warningbox}" in tex,
        "dialoguebox": "\\newtcolorbox{dialoguebox}" in tex,
        "titlepage": "\\begin{titlepage}" in tex,
        "tableofcontents": "\\tableofcontents" in tex,
    }
    box_pattern = re.compile(
        r"\\begin\{(?:knowledgebox|importantbox|warningbox|dialoguebox)\}.*?\\end\{(?:knowledgebox|importantbox|warningbox|dialoguebox)\}",
        re.S,
    )
    figures_inside_boxes = any("\\includegraphics" in match.group(0) for match in box_pattern.finditer(tex))

    summary_ok = allow_missing_summaries or sections == 0 or summaries >= max(1, sections - 1)
    checks = {
        "template_markers_present": all(required_template_markers.values()),
        "body_graphics_present": len(include_paths) > 1 if expected_graphics else len(include_paths) >= 1,
        "manifest_graphics_referenced": not missing_graphics,
        "major_sections_have_summaries": summary_ok,
        "keyframes_have_same_page_time_footnotes": not keyframe_missing_footnote,
        "figures_outside_boxes": not figures_inside_boxes,
    }

    return {
        "passed": all(checks.values()),
        "checks": checks,
        "counts": {
            "sections": sections,
            "summaries": summaries,
            "includegraphics": len(include_paths),
            "figures": len(figures),
            "time_footnotes": len(footnotes),
            "selected_keyframes": len(selected_keyframes),
            "inserted_assets": len(assets),
        },
        "required_template_markers": required_template_markers,
        "missing_graphics_from_manifest": missing_graphics,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tex", type=Path, required=True, help="Path to final LaTeX file.")
    parser.add_argument("--manifest", type=Path, help="Path to assets/asset_manifest.json.")
    parser.add_argument(
        "--allow-missing-summaries",
        action="store_true",
        help="Allow missing 本章小结 only for documented user-approved legacy exceptions.",
    )
    parser.add_argument("--out", type=Path, help="Optional JSON report output path.")
    args = parser.parse_args()

    tex_path = args.tex.expanduser().resolve()
    if not tex_path.exists():
        raise SystemExit(f"TeX file not found: {tex_path}")

    report = check(
        tex_path.read_text(encoding="utf-8"),
        load_manifest(args.manifest.expanduser().resolve() if args.manifest else None),
        allow_missing_summaries=args.allow_missing_summaries,
    )
    report["tex"] = str(tex_path)
    if args.manifest:
        report["manifest"] = str(args.manifest.expanduser().resolve())

    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
    print(text, end="")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
