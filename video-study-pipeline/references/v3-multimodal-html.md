# V3 Multimodal Study HTML

Use this reference whenever the selected output includes article HTML. It defines the accepted interaction shell. For new runs, also read `references/v4-learning-notes.md`: V4 is the default content profile inside this V3 shell.

## Product Baseline

The accepted baseline is the original V3 multimodal study page, not a static Blog page and not the rejected content-router experiment. Its job is to preserve more of a video's information while lowering review cost. The shell version and content profile are deliberately separate: V3 owns interaction and source recall; V4 owns learning-note organization and teaching treatment.

The finished page must provide:

- a source-cover hero with title, duration, transcript count, evidence-frame count, and chapter count;
- a configurable study route (`精读笔记` for V4, legacy `图文精读` for V3) with a sticky chapter index and reading progress;
- editorially reconstructed chapters whose prose, keyframes, diagrams, tables, formulas, and code are placed in context;
- a merged `章节与字幕` route: chapter timeline, semantic cleaned transcript, and expandable complete raw ASR;
- clickable timestamps that open the local video and seek to the correct point;
- paragraph-level source clips with explicit start/end times, focused playback, automatic stop, and return-to-reading behavior;
- a polished custom local-video player with explicit `整理字幕` and `逐字字幕` modes plus an independent subtitle visibility control; 0.75-2x playback speed; a scrubber; 10-second skip controls; volume, mute, and fullscreen controls; and locally persisted player preferences;
- an explicit focus mode that temporarily collapses subtitles and the full control menu to a video-only surface; it keeps the close button available and reveals a small exit control on pointer activity or pause, then auto-hides it during playback;
- no duplicate chapter list inside the player; chapter navigation belongs to the article reading path and merged chapter/transcript route, while contextual source links seek the player directly;
- global search across article prose, chapter summaries, and cleaned transcript;
- chapter and exact-time bookmarks stored locally in the browser;
- paragraph excerpts and personal notes stored locally, bound to source time, and exportable as Markdown;
- desktop and mobile layouts without horizontal overflow or cropped evidence images.

Do not add a standalone evidence appendix, asset inventory, transcript-search page, or content-router explanation to the reader-facing product. Evidence belongs next to the claim it supports. Chapter timeline and transcript search are one feature, not separate destinations.

## Editorial Model Before Rendering

Create `v4_study_model.json` after `deep_note.md`, `asset_manifest.json`, selected assets, and the full timestamped transcript exist. The model is an editorial layer, not an automatically generated table of contents. The filename is a convention; the schema remains `v3-multimodal-study-model@1` so existing V3 models remain compatible.

Required schema:

```json
{
  "schema_version": "v3-multimodal-study-model@1",
  "metadata": {
    "bvid": "BV...",
    "title": "source title",
    "uploader": "source author",
    "duration_seconds": 1200,
    "canonical_url": "https://www.bilibili.com/video/BV...",
    "transcript_source": "platform subtitle or local ASR"
  },
  "ui": {
    "product_version": "V4",
    "brand_badge": "V4 学习笔记",
    "title_suffix": "V4 学习笔记",
    "study_tab_label": "精读笔记",
    "humanize_asset_labels": true,
    "learning_note_style": true,
    "show_thesis_map": false,
    "compact_source_clips": true,
    "chapter_time_seekable": false,
    "max_source_clips_per_chapter": 1
  },
  "source": {
    "cover": "assets/source/cover.jpg",
    "video": "assets/source/video.mp4",
    "transcript": "transcript_final.srt"
  },
  "hero": {
    "eyebrow": "MULTIMODAL STUDY · BV...",
    "title_html": "short designed title",
    "deck": "one 25-55-character content thesis; never describe the note product or playback features"
  },
  "lead": {
    "title": "content-specific orientation question or thesis",
    "body_markdown": "one or two short orientation paragraphs"
  },
  "chapters": [
    {
      "id": "stable-slug",
      "start": 0,
      "end": 240,
      "label": "short navigation label",
      "kicker": "short conceptual role",
      "title": "claim-led chapter title",
      "summary": "one accurate chapter thesis",
      "body_markdown": "fully edited explanatory body with contextual asset anchors",
      "source_clips": [
        {
          "id": "CL01",
          "after_paragraph": 2,
          "start": 42,
          "end": 96,
          "label": "focused reason this paragraph is worth replaying"
        }
      ],
      "cleaned_transcript": [
        {"start": 12, "end": 80, "text": "semantic transcript block"}
      ]
    }
  ],
  "assets": {
    "keyframes": {
      "KF01": {"src": "assets/keyframes/selected/KF01.jpg", "caption": "...", "time": 60}
    },
    "diagrams": {
      "DG01": {"src": "assets/diagrams/DG01.svg", "caption": "..."}
    },
    "search_suggestions": ["term 1", "term 2"]
  },
  "conclusion_title": "conclusion heading",
  "conclusion_markdown": "integrated conclusion and transfer guidance"
}
```

## Chapter Quality

Use 5-9 chapters for most medium or long videos, but choose boundaries from topic changes rather than a fixed count. Preserve the video's important argument transitions, mechanisms, examples, objections, uncertainty, and decisions. Do not collapse a dense source into several broad labels merely to make the page shorter.

Each chapter needs three distinct layers:

1. `summary`: the chapter thesis, not a generic abstract.
2. `body_markdown`: Blog-quality explanation reconstructed from the full source and assets.
3. `cleaned_transcript`: time-ordered semantic blocks that retain claims, mechanisms, examples, qualifications, and distinctive wording while removing false starts, filler, and repetition.

The cleaned transcript is not generated by splitting the Blog body and is not copied from raw ASR. It is a separate source-faithful reading layer. Every block must retain a source interval and must be checkable against the expandable raw transcript.

The cleaned transcript must cover every raw ASR segment that contains speech. It may combine many short ASR segments into one semantic block, but it must not leave spoken intervals blank. The renderer treats uncovered speech as a hard failure rather than displaying a reader-facing placeholder.

`source_clips` is a selective paragraph-to-source map, not a chapter replay button duplicated after every paragraph. V4 defaults to one primary clip per chapter; omit it when no focused interval is justified. A second clip requires an explicit `ui.max_source_clips_per_chapter` override, must prove a materially different claim, and must not duplicate an adjacent clickable keyframe. Each clip should normally be 40-90 seconds, must stay inside its chapter, and must explain the nearby paragraph, example, demonstration, objection, or modality-specific evidence. `after_paragraph` is one-based and counts direct prose paragraphs in the rendered chapter body. Clips longer than 180 seconds fail validation. The chapter header range is orientation only in V4; exhaustive playback remains available through the merged timeline and transcript.

## Visual Placement

Use the existing asset intent rules:

- `evidence`: inspected source keyframes near the claim or example they prove;
- `structure`: Mermaid-derived diagram near the mechanism or relationship it explains;
- `comparison`: Markdown table or chart at the exact comparison point;
- formulas and code: reader-facing rendered blocks with surrounding explanation.

Accepted body anchors:

```text
【关键帧：KF01，caption，source_time=01:20，intent=evidence，reason=...】
【插图：DG01，caption，intent=structure，reason=...】
```

Tables stay as Markdown tables. Raw Mermaid source must be pre-rendered and referenced through a diagram asset. Do not leave asset anchors, Mermaid source, audit labels, or `assets used` descriptions visible in the final page.

## Rendering

Render with:

```bash
node scripts/render_v3_multimodal_html.cjs \
  --model /absolute/path/to/v4_study_model.json \
  --output /absolute/path/to/<video-title>.html \
  --report /absolute/path/to/renderer_report.json
```

The renderer uses `assets/v3-multimodal/style.css` and `assets/v3-multimodal/app.js`, extracted from the accepted original V3 product. Do not replace them with a generic article template unless the user explicitly chooses another HTML family.

When an audited `deep_note.md` already exists, keep its long-form prose as the
single source of truth. Author chapter boundaries, summaries, semantic cleaned
transcript blocks, and asset bindings in `v4_editorial_plan.json`, then assemble
the complete renderer model:

```bash
node scripts/assemble_v3_study_model.cjs \
  --plan /absolute/path/to/v4_editorial_plan.json \
  --output /absolute/path/to/v4_study_model.json
```

The assembler extracts each chapter body by its exact Markdown heading. It does
not generate, pad, summarize, or regex-rewrite prose. `cleaned_transcript`
remains an editorial responsibility and must preserve source order and claims.

Existing `v3_editorial_plan.json` and `v3_study_model.json` files remain valid. If the optional `ui` object is absent, the renderer must keep the original V3 labels, title suffix, and styling.

## Required QA

Run browser QA on every video separately:

- all model chapters, cleaned transcript blocks, and raw transcript segments are present;
- every selected `insert: true` asset is inserted or has a concrete skip reason;
- no broken images, unresolved asset anchors, raw Mermaid, or console errors;
- keyframe and timeline timestamps seek the local video within a reasonable tolerance;
- every paragraph source clip starts at the declared time, stops at the declared end, and returns to its originating paragraph;
- V4 chapter headers contain non-interactive time labels, not duplicate chapter-level playback buttons; the default reading view has at most one source-clip button per chapter;
- raw subtitles follow exact timestamped transcript segments, cleaned subtitles follow semantic chapter blocks, and all three subtitle modes switch without losing the active clip;
- every raw speech segment overlaps a cleaned semantic block; `cleaned_transcript_coverage.ratio` must equal `1` before delivery;
- the close-player button remains visible at the upper-right corner in floating, split, compact, fullscreen, desktop, and mobile modes;
- playback speed, subtitle mode, volume, and mute preferences persist after reload;
- the scrubber stays within the active clip interval, 10-second skip respects clip boundaries, and clip-end auto-stop works at non-1x playback speeds;
- custom play/pause, volume, mute, and fullscreen controls work by mouse and keyboard;
- global search, timeline search, bookmark persistence, reading progress, compact player, and split player work;
- paragraph note creation, selected-text excerpt capture, edit/delete persistence, source playback, and Markdown export work;
- desktop and 390px mobile widths have no document-level horizontal overflow; the mobile control row may scroll internally while keeping play, skip, speed, and time controls immediately accessible;
- a visual screenshot of the hero, one dense chapter, the timeline transcript, and mobile layout is reviewed.

Compilation or DOM counts alone are not visual acceptance.
