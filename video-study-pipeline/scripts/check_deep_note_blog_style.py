#!/usr/bin/env python3
"""Check deep_note.md for Blog-style, asset-aware writing."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


CANONICAL_BODY_H2 = "1. 主体正文：按 Blog 方式重构源材料内容"
LEGACY_VIDEO_BODY_H2 = "1. 主体正文：按 Blog 方式重构视频内容"
REQUIRED_H2_ALIASES = {
    CANONICAL_BODY_H2: [CANONICAL_BODY_H2, LEGACY_VIDEO_BODY_H2],
    "2. 判断框架与结论": ["2. 判断框架与结论"],
}

BANNED_PHRASES = [
    "本节结论",
    "本节主要介绍",
    "这一部分讲了",
    "视频开头讨论",
    "视频开头",
    "真正值得问的问题",
]

REMOVED_STANDALONE_H2_PATTERNS = [
    re.compile(r"(?:\d+\.\s*)?观点卡片$"),
    re.compile(r"(?:\d+\.\s*)?背景与问题(?:：为什么这个话题值得讨论)?$"),
    re.compile(r"(?:\d+\.\s*)?全文结构图(?:：这期视频的论证地图)?$"),
    re.compile(r"(?:\d+\.\s*)?阅读导航(?:：如何读这期视频)?$"),
    re.compile(r"(?:\d+\.\s*)?核心概念与术语$"),
    re.compile(r"(?:\d+\.\s*)?总结(?:：最值得带走的\s*3-5\s*个结论)?$"),
]

GENERIC_PADDING_PATTERNS = [
    r"不应该被读成一句孤立结论",
    r"更有用的读法，是先看这个判断解决了什么问题",
    r"否则人很容易只记住态度，却没有形成判断能力",
    r"进一步说，?[\"“][^\"”]+[\"”]\s*不应该被读成一句孤立结论",
    r"落到实践中，?这一层至少要追问三件事",
    r"当前处境里的关键变量是什么；第二，哪些变量是个人可以改变的",
    r"这样处理以后，内容就不只是总结，而会变成可以迁移到现实决策中的方法",
]

RECAP_PATTERNS = [
    r"讲者(?:指出|认为|提到|表示|接着|强调)",
    r"视频(?:指出|认为|提到|表示|接着|强调|讲到|介绍)",
    r"UP\s*主(?:指出|认为|提到|表示|接着|强调)",
]

# Count only recap-style mentions of "视频". Topic terms such as "短视频",
# "视频平台", or "看视频学习" can be legitimate subject matter.
VIDEO_RECAP_CONTEXT_RE = re.compile(
    r"(?<!短)视频(?:里|中|开头|结尾|前半部分|后半部分|前半段|后半段|"
    r"指出|认为|提到|表示|接着|强调|讲到|讲了|介绍|讨论|呈现|提供)"
)

ASSET_ANCHOR_RE = re.compile(r"【(?:插图|关键帧|表格|截图建议|图片|图表|源图|公式|代码)：[^】]+】")
MERMAID_RE = re.compile(r"```mermaid\b", re.I)
MERMAID_BLOCK_RE = re.compile(r"```mermaid\b(.*?)```", re.I | re.S)
TABLE_RE = re.compile(r"^\|.+\|\s*$", re.M)
CODE_RE = re.compile(r"```(?!mermaid\b).+", re.I)

GENERIC_STRUCTURE_LABELS = [
    "背景问题",
    "核心概念",
    "论证链条",
    "可迁移框架",
    "总结",
]

DECORATIVE_KEYFRAME_HARD_PATTERNS = [
    "避免页面太单调",
    "页面太单调",
    "凑版面",
    "增加一点画面",
    "补充画面",
    "美化页面",
    "装饰用",
    "配图用",
]

EVIDENCE_REASON_TERMS = [
    "证据",
    "原视频",
    "原始",
    "讲义",
    "白板",
    "代码",
    "图表",
    "表格",
    "画面",
    "场景",
    "展示",
    "论证",
    "source",
]


def extract_section(text: str, h2_prefix: str) -> str:
    pattern = re.compile(rf"^##\s+{re.escape(h2_prefix)}.*?$", re.M)
    match = pattern.search(text)
    if not match:
        return ""
    next_match = re.search(r"^##\s+", text[match.end() :], re.M)
    end = match.end() + next_match.start() if next_match else len(text)
    return text[match.end() : end]


def extract_first_section(text: str, h2_prefixes: list[str]) -> str:
    for prefix in h2_prefixes:
        section = extract_section(text, prefix)
        if section:
            return section
    return ""


def h2_titles(text: str) -> list[str]:
    return [match.group(1).strip() for match in re.finditer(r"^##\s+(.+?)\s*$", text, re.M)]


def missing_required_h2(titles: list[str]) -> list[str]:
    missing: list[str] = []
    for canonical, aliases in REQUIRED_H2_ALIASES.items():
        if not any(alias in titles for alias in aliases):
            missing.append(canonical)
    return missing


def normalize_diagram_label(label: str) -> str:
    label = re.sub(r"<br\s*/?>", "", label, flags=re.I)
    label = re.sub(r"<[^>]+>", "", label)
    return re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff]+", "", label)


def is_generic_structure_label(label: str) -> bool:
    normalized = normalize_diagram_label(label)
    for generic in GENERIC_STRUCTURE_LABELS:
        generic_normalized = normalize_diagram_label(generic)
        if normalized == generic_normalized:
            return True
        if normalized.endswith(generic_normalized) and len(normalized) <= len(generic_normalized) + 2:
            return True
    return False


def extract_mermaid_labels(block: str) -> list[str]:
    labels: list[str] = []
    for pattern in (
        r"\[([^\[\]]+)\]",
        r"\{([^{}]+)\}",
        r"\(\(([^()]+)\)\)",
        r"\(([^()]+)\)",
    ):
        labels.extend(match.strip().strip("\"'") for match in re.findall(pattern, block))
    return [label for label in labels if label]


def low_information_mermaid_blocks(text: str) -> list[dict[str, Any]]:
    low_info: list[dict[str, Any]] = []
    for idx, match in enumerate(MERMAID_BLOCK_RE.finditer(text), start=1):
        block = match.group(1)
        labels = extract_mermaid_labels(block)
        if not labels:
            continue
        generic_labels = [label for label in labels if is_generic_structure_label(label)]
        informative_labels = [
            label
            for label in labels
            if not is_generic_structure_label(label) and len(normalize_diagram_label(label)) >= 8
        ]
        if len(generic_labels) >= 4 and len(informative_labels) <= 1:
            low_info.append(
                {
                    "block_index": idx,
                    "generic_labels": generic_labels,
                    "informative_labels": informative_labels,
                }
            )
    return low_info


def subsection_bodies(section5: str) -> list[dict[str, Any]]:
    matches = list(re.finditer(r"^###\s+(.+?)\s*$", section5, re.M))
    bodies: list[dict[str, Any]] = []
    for idx, match in enumerate(matches):
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(section5)
        body = section5[match.end() : end]
        cleaned_lines: list[str] = []
        in_code = False
        for raw in body.splitlines():
            line = raw.strip()
            if line.startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                continue
            if not line or line.startswith("> 时间戳") or line.startswith("【"):
                continue
            if line.startswith("|"):
                continue
            cleaned_lines.append(line)
        cleaned = re.sub(r"[#*`>\-\s|:：/\\.,，。；;！!？?（）()\[\]【】]", "", "".join(cleaned_lines))
        bodies.append(
            {
                "title": match.group(1).strip(),
                "body_chars": len(cleaned),
                "first_nonempty": next((line for line in body.splitlines() if line.strip()), ""),
            }
        )
    return bodies


def load_manifest(path: Path | None) -> dict[str, Any]:
    if not path:
        return {}
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def inserted_manifest_assets(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    assets: list[dict[str, Any]] = []
    for group in (
        "selected_keyframes",
        "source_images",
        "source_figures",
        "pdf_figures",
        "web_images",
        "generated_diagrams",
        "tables",
        "formulas",
    ):
        for item in manifest.get(group, []):
            if item.get("insert", True):
                item = dict(item)
                item["_group"] = group
                assets.append(item)
    return assets


def manifest_items(manifest: dict[str, Any], key: str) -> list[dict[str, Any]]:
    value = manifest.get(key, [])
    return value if isinstance(value, list) else []


def normalized_manifest_text(*values: Any) -> str:
    chunks: list[str] = []
    for value in values:
        if isinstance(value, str):
            chunks.append(value)
        elif isinstance(value, list):
            chunks.extend(str(item) for item in value)
        elif isinstance(value, dict):
            chunks.extend(str(item) for item in value.values())
        elif value is not None:
            chunks.append(str(value))
    return " ".join(chunks).lower()


def parse_duration_seconds(value: Any) -> int | None:
    if isinstance(value, (int, float)):
        return int(value)
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value:
        return None
    if value.isdigit():
        return int(value)
    parts = value.split(":")
    if not all(part.isdigit() for part in parts):
        return None
    total = 0
    for part in parts:
        total = total * 60 + int(part)
    return total


def source_duration_seconds(manifest: dict[str, Any]) -> int | None:
    source = manifest.get("source", {}) if isinstance(manifest.get("source"), dict) else {}
    for key in ("duration_seconds", "duration_sec", "duration"):
        parsed = parse_duration_seconds(source.get(key))
        if parsed is not None:
            return parsed
    for key in ("duration_seconds", "duration_sec", "duration"):
        parsed = parse_duration_seconds(manifest.get(key))
        if parsed is not None:
            return parsed
    return None


def anchor_texts(kind: str, text: str) -> list[str]:
    return re.findall(rf"【{kind}：([^】]+)】", text)


def has_anchor_reason_with_terms(anchors: list[str], terms: list[str]) -> bool:
    return any(any(term.lower() in anchor.lower() for term in terms) for anchor in anchors)


def asset_intent_roles(text: str, body_section: str, manifest: dict[str, Any]) -> dict[str, bool]:
    body_asset_anchors = ASSET_ANCHOR_RE.findall(body_section)
    keyframe_anchors = anchor_texts("关键帧", body_section)
    image_anchors = anchor_texts("插图", body_section) + anchor_texts("图表", body_section)
    table_anchors = anchor_texts("表格", body_section)
    selected_keyframes = manifest_items(manifest, "selected_keyframes")
    source_images = (
        manifest_items(manifest, "source_images")
        + manifest_items(manifest, "source_figures")
        + manifest_items(manifest, "pdf_figures")
        + manifest_items(manifest, "web_images")
    )
    generated_diagrams = manifest_items(manifest, "generated_diagrams")
    tables = manifest_items(manifest, "tables")
    formulas = manifest_items(manifest, "formulas")

    concept_terms = ["概念", "心智", "隐喻", "插画", "锚点", "机制图", "概念图", "材质"]
    concept_manifest_terms = ["concept", "anchor", "插画", "概念", "锚点"]

    structure_manifest_terms = [
        "mermaid",
        "flowchart",
        "architecture",
        "causal",
        "decision",
        "timeline",
        "workflow",
        "流程",
        "架构",
        "论证",
        "因果",
    ]

    generated_text = normalized_manifest_text(generated_diagrams)
    table_text = normalized_manifest_text(tables)

    return {
        "evidence": bool(
            keyframe_anchors
            or selected_keyframes
            or source_images
            or formulas
            or "【截图建议：" in body_section
            or has_anchor_reason_with_terms(image_anchors, ["证据", "原始", "来源", "source", "图表", "公式"])
        ),
        "structure": bool(MERMAID_RE.search(body_section) or any(term in generated_text for term in structure_manifest_terms)),
        "comparison": bool(
            len(TABLE_RE.findall(body_section)) >= 2
            or table_anchors
            or tables
            or any(term in table_text for term in ("comparison", "matrix", "对比", "比较", "指标", "变量"))
        ),
        "concept_anchor": bool(
            has_anchor_reason_with_terms(image_anchors, concept_terms)
            or any(term in generated_text for term in concept_manifest_terms)
        ),
        "has_body_asset": bool(body_asset_anchors or MERMAID_RE.search(body_section) or TABLE_RE.search(body_section)),
    }


def asset_selection_policy_status(text: str, body_section: str, manifest: dict[str, Any]) -> dict[str, Any]:
    duration = source_duration_seconds(manifest)
    roles = asset_intent_roles(text, body_section, manifest)
    source = manifest.get("source", {}) if isinstance(manifest.get("source"), dict) else {}
    quality = manifest.get("quality_checks", {}) if isinstance(manifest.get("quality_checks"), dict) else {}
    skip_reason = normalized_manifest_text(
        quality.get("asset_policy_skip_reason"),
        quality.get("asset_mix_skip_reason"),
        source.get("asset_policy_skip_reason"),
    )
    policy_applies = bool(manifest and duration is not None and duration >= 900)
    role_count = sum(1 for key in ("evidence", "structure", "comparison") if roles[key])
    passed = bool(not policy_applies or role_count >= 2 or skip_reason)
    return {
        "passed": passed,
        "policy_applies": policy_applies,
        "duration_seconds": duration,
        "role_count": role_count,
        "roles": roles,
        "skip_reason_excerpt": skip_reason[:500],
    }


def decorative_keyframe_items(text: str, manifest: dict[str, Any]) -> list[dict[str, Any]]:
    offenders: list[dict[str, Any]] = []
    keyframe_anchors = anchor_texts("关键帧", text)
    for anchor in keyframe_anchors:
        lowered = anchor.lower()
        hard_hit = next((pattern for pattern in DECORATIVE_KEYFRAME_HARD_PATTERNS if pattern in anchor), "")
        weak_hit = "装饰" in anchor and not any(term.lower() in lowered for term in EVIDENCE_REASON_TERMS)
        if hard_hit or weak_hit:
            offenders.append({"source": "deep_note", "text": anchor, "pattern": hard_hit or "装饰"})
    for item in manifest_items(manifest, "selected_keyframes"):
        text_blob = normalized_manifest_text(item.get("caption"), item.get("reason"), item.get("notes"))
        hard_hit = next((pattern for pattern in DECORATIVE_KEYFRAME_HARD_PATTERNS if pattern in text_blob), "")
        weak_hit = "装饰" in text_blob and not any(term.lower() in text_blob for term in EVIDENCE_REASON_TERMS)
        if hard_hit or weak_hit:
            offenders.append(
                {
                    "source": "asset_manifest.selected_keyframes",
                    "id": item.get("id"),
                    "caption": item.get("caption"),
                    "reason": item.get("reason"),
                    "pattern": hard_hit or "装饰",
                }
            )
    return offenders


def keyframe_policy_status(manifest: dict[str, Any]) -> dict[str, Any]:
    """Return whether keyframe absence is explained by real acquisition evidence."""

    source = manifest.get("source", {}) if isinstance(manifest.get("source"), dict) else {}
    quality = manifest.get("quality_checks", {}) if isinstance(manifest.get("quality_checks"), dict) else {}
    selected = manifest_items(manifest, "selected_keyframes")
    skipped = manifest_items(manifest, "skipped_keyframes")
    candidates = manifest_items(manifest, "candidate_keyframes")
    source_text = normalized_manifest_text(source)
    reason_text = normalized_manifest_text(
        quality.get("keyframe_skip_reason"),
        quality.get("notes"),
        quality.get("warnings"),
        source.get("video_probe_error"),
        source.get("video_download_error"),
        source.get("video_unavailable_reason"),
    )
    platform = str(source.get("platform") or "").lower()
    source_url = str(source.get("source_url") or "").lower()
    is_video_source = any(
        token in f"{platform} {source_url}"
        for token in ("bilibili", "youtube", "youtu.be", "b23.tv", "bv")
    )
    selected_insert_count = sum(1 for item in selected if item.get("insert", True))
    explicit_disabled = any(token in reason_text for token in ("user disabled", "用户禁用", "keyframes disabled"))
    acquisition_attempt_recorded = bool(
        source.get("video_probe_attempted")
        or source.get("video_download_attempted")
        or source.get("video_probe_error")
        or source.get("video_download_error")
        or quality.get("video_probe_attempted")
        or quality.get("video_download_attempted")
    )
    specific_unavailable_reason = any(
        token in reason_text
        for token in (
            "login",
            "cookie",
            "403",
            "404",
            "copyright",
            "unavailable",
            "download_failed",
            "probe_failed",
            "no stream",
            "no_stream",
            "无法下载",
            "需要登录",
            "版权",
            "不可用",
        )
    )
    absent_but_documented = bool(
        not selected_insert_count
        and (
            explicit_disabled
            or skipped
            or candidates
            or (acquisition_attempt_recorded and specific_unavailable_reason)
        )
    )
    passed = bool(
        not manifest
        or not is_video_source
        or selected_insert_count
        or absent_but_documented
    )
    return {
        "passed": passed,
        "is_video_source": is_video_source,
        "selected_insert_count": selected_insert_count,
        "skipped_count": len(skipped),
        "candidate_count": len(candidates),
        "acquisition_attempt_recorded": acquisition_attempt_recorded,
        "specific_unavailable_reason": specific_unavailable_reason,
        "explicit_disabled": explicit_disabled,
        "source_video_available": source.get("video_available"),
        "reason_excerpt": reason_text[:500],
        "source_excerpt": source_text[:500],
    }


def asset_ids_missing_from_text(text: str, manifest: dict[str, Any]) -> list[dict[str, Any]]:
    missing: list[dict[str, Any]] = []
    normalized_text = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "", text.lower())
    for item in inserted_manifest_assets(manifest):
        asset_id = str(item.get("id") or "").strip()
        path_stem = Path(str(item.get("path") or "")).stem
        candidates = [asset_id, path_stem]
        found = False
        for candidate in candidates:
            key = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "", candidate.lower())
            if key and key in normalized_text:
                found = True
                break
        if not found:
            missing.append(
                {
                    "id": asset_id,
                    "path": item.get("path"),
                    "group": item.get("_group"),
                    "caption": item.get("caption"),
                }
            )
    return missing


def check(path: Path, manifest_path: Path | None = None) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    manifest = load_manifest(manifest_path)
    body_section = extract_first_section(text, REQUIRED_H2_ALIASES[CANONICAL_BODY_H2])
    titles = h2_titles(text)

    missing_h2 = missing_required_h2(titles)
    removed_standalone_h2 = [
        title
        for title in titles
        if any(pattern.fullmatch(title) for pattern in REMOVED_STANDALONE_H2_PATTERNS)
    ]
    banned_hits = [
        {"phrase": phrase, "count": text.count(phrase)}
        for phrase in BANNED_PHRASES
        if text.count(phrase) > 0
    ]
    generic_padding_hits = []
    for pattern in GENERIC_PADDING_PATTERNS:
        matches = re.findall(pattern, text)
        if matches:
            generic_padding_hits.append({"pattern": pattern, "count": len(matches)})
    recap_hits = []
    for pattern in RECAP_PATTERNS:
        matches = re.findall(pattern, body_section)
        if matches:
            recap_hits.append({"pattern": pattern, "count": len(matches)})

    bodies = subsection_bodies(body_section)
    short_bodies = [item for item in bodies if item["body_chars"] < 320]
    frontloaded_conclusion = [
        item
        for item in bodies
        if "本节结论" in item["first_nonempty"] or "结论" in item["first_nonempty"][:12]
    ]
    body_video_count = body_section.count("视频")
    body_video_recap_context_count = len(VIDEO_RECAP_CONTEXT_RE.findall(body_section))
    speaker_terms = ["讲者", "演讲者", "老师", "嘉宾", "UP 主", "受访者", "主持人"]
    body_speaker_count = sum(body_section.count(term) for term in speaker_terms)
    malformed_speaker_terms = [
        phrase
        for phrase in ("演叙述者", "讲叙述者", "叙述者者", "UP 主叙述者")
        if phrase in text
    ]
    asset_anchors = ASSET_ANCHOR_RE.findall(text)
    body_asset_anchors = ASSET_ANCHOR_RE.findall(body_section)
    mermaid_count = len(MERMAID_RE.findall(text))
    body_table_lines = len(TABLE_RE.findall(body_section))
    table_lines = len(TABLE_RE.findall(text))
    code_blocks = len(CODE_RE.findall(text))
    low_information_mermaids = low_information_mermaid_blocks(text)
    manifest_assets = inserted_manifest_assets(manifest)
    missing_manifest_assets = asset_ids_missing_from_text(text, manifest) if manifest else []
    keyframe_policy = keyframe_policy_status(manifest)
    asset_selection_policy = asset_selection_policy_status(text, body_section, manifest)
    decorative_keyframes = decorative_keyframe_items(text, manifest)
    has_material_slots = bool(asset_anchors or mermaid_count or table_lines or code_blocks)
    body_has_material_slots = bool(body_asset_anchors or body_table_lines or CODE_RE.search(body_section) or MERMAID_RE.search(body_section))

    checks = {
        "required_h2_present": not missing_h2,
        "no_removed_standalone_sections": not removed_standalone_h2,
        "no_banned_report_scaffolding": not banned_hits,
        "no_generic_padding": not generic_padding_hits,
        "not_recap_voice_heavy": sum(item["count"] for item in recap_hits) <= 3,
        "body_not_video_word_heavy": body_video_recap_context_count <= 4,
        "speaker_terms_used_naturally": not malformed_speaker_terms,
        "short_sections_are_not_forced_failures": True,
        "no_frontloaded_labeled_conclusion": not frontloaded_conclusion,
        "deep_note_has_material_slots": has_material_slots,
        "no_low_information_mermaid": not low_information_mermaids,
        "body_has_contextual_material_slots": body_has_material_slots or not manifest_assets,
        "manifest_insert_assets_referenced": not missing_manifest_assets,
        "keyframes_selected_or_absence_documented": keyframe_policy["passed"],
        "asset_selection_policy_followed": asset_selection_policy["passed"],
        "keyframes_not_used_as_decoration": not decorative_keyframes,
    }
    return {
        "passed": all(checks.values()),
        "path": str(path),
        "checks": checks,
        "missing_h2": missing_h2,
        "removed_standalone_h2": removed_standalone_h2,
        "banned_hits": banned_hits,
        "generic_padding_hits": generic_padding_hits,
        "recap_hits": recap_hits,
        "malformed_speaker_terms": malformed_speaker_terms,
        "body_counts": {
            "video": body_video_count,
            "video_recap_context": body_video_recap_context_count,
            "speaker_terms": body_speaker_count,
            "subsections": len(bodies),
            "short_subsections": len(short_bodies),
        },
        "asset_counts": {
            "asset_anchors": len(asset_anchors),
            "body_asset_anchors": len(body_asset_anchors),
            "mermaid_blocks": mermaid_count,
            "table_lines": table_lines,
            "body_table_lines": body_table_lines,
            "code_blocks": code_blocks,
            "low_information_mermaid_blocks": len(low_information_mermaids),
            "manifest_insert_assets": len(manifest_assets),
            "manifest_assets_missing_in_deep_note": len(missing_manifest_assets),
            "selected_keyframes": keyframe_policy["selected_insert_count"],
            "skipped_keyframes": keyframe_policy["skipped_count"],
            "candidate_keyframes": keyframe_policy["candidate_count"],
            "asset_intent_roles": asset_selection_policy["roles"],
            "asset_intent_role_count": asset_selection_policy["role_count"],
        },
        "keyframe_policy": keyframe_policy,
        "asset_selection_policy": asset_selection_policy,
        "decorative_keyframes": decorative_keyframes[:10],
        "low_information_mermaid_blocks": low_information_mermaids[:10],
        "manifest_assets_missing_in_deep_note": missing_manifest_assets[:20],
        "short_subsections": short_bodies[:10],
        "frontloaded_conclusion": frontloaded_conclusion[:10],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("deep_note", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--warn-only", action="store_true")
    args = parser.parse_args()

    report = check(
        args.deep_note.expanduser().resolve(),
        args.manifest.expanduser().resolve() if args.manifest else None,
    )
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
    print(text, end="")
    if args.warn_only:
        return 0
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
