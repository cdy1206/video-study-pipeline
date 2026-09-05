---
name: video-study-pipeline
description: "Use when the user provides a video URL, BV/Bilibili/YouTube link, ASR transcript, speech draft, meeting notes, article, webpage, or PDF and wants deep Chinese study outputs: Blog-style notes, PDF lecture note, beautiful article HTML, 16:9 web presentation, or any combination."
---

# Video Study Pipeline

## Core Principle

Turn one source item into one source-backed study package. Video remains the best-supported input path, but the architecture should treat videos, ASR text, meeting notes, articles, webpages, and PDFs as adapters into the same intermediate source layer.

Canonical content path:

`input -> input adapter -> unified_source/metadata/assets -> knowledge reconstruction -> deep_note.md + asset_manifest/assets -> renderer-specific enrichment brief(s) -> selected renderer(s) -> recall/render audit -> Downloads package`

Do not produce final notes from metadata, title, screenshots, danmaku, comments, or browser text alone. If the input is a video and no usable subtitle exists while audio can be obtained, produce a complete timestamped ASR transcript before writing the final study material. If the input is text/PDF/web material, first build a traceable `unified_source.md` or equivalent source package instead of writing directly from a loose paste.

`deep_note.md` is the shared content base. `asset_manifest.json` plus the reviewed `assets/` directory is the shared evidence/visual base. They are not finished outputs. PDF, article HTML, and presentation HTML each need their own organization, asset placement, and style treatment before final rendering. For this user's normal HTML output, use the V4 learning-note content profile in `references/v4-learning-notes.md` inside the accepted V3 multimodal interaction shell defined in `references/v3-multimodal-html.md`. V4 improves teaching structure; V3 continues to provide focused source clips, search, timeline/transcript recall, bookmarks, reading progress, and locally persisted/exportable personal notes.

`deep_note.md` must be asset-aware. It should not embed raw image binaries, but it must contain contextual asset anchors, inline tables, Mermaid/source diagrams, screenshot suggestions, quote/callout candidates, or other material slots exactly where the body needs them. `asset_manifest.json` binds those anchors to actual files, timestamps, selected/skipped decisions, and renderer status. A pure prose `deep_note.md` fails the pipeline when useful visual/data assets exist or should be generated.

Before writing asset-aware `deep_note.md` sections or rendering any selected output, read `references/visual-asset-selection.md`. Before rendering, also read `references/renderer-enrichment.md` and create or update the relevant renderer brief: `article_render_brief.md`, `pdf_render_brief.md`, or `presentation/storyboard.md` with `script.md` and `outline.md`. A plain `deep_note.md` format conversion is only acceptable when the user explicitly asks for raw export.

The asset pool is an intermediate evidence layer, not a new visible article structure. It includes keyframes, cover, diagrams, tables/charts, keywords, glossary items, pull quotes, timelines, comparison cards, source anchors, and reader aids. Do not turn it into a front-loaded "asset table" in the final article unless the user explicitly asks for an audit appendix. Assets should be placed where they support the surrounding argument.

PDF output has two families. Read `references/pdf-output-families.md` before rendering a PDF. The normal default output profile does not include PDF. When the user explicitly asks for PDF without naming a family, default to the DeepNote LaTeX PDF: preserve `deep_note.md` order, consume `asset_manifest.json` and reviewed assets, and optimize the result for printing. Use an article-derived PDF only when the user wants the printed file to retain the HTML appearance. Do not fall back to shallow subtitle-summary notes.

When repairing or regenerating an output the user already likes, preserve the existing renderer structure and visual language. Add missing assets by minimally patching the existing LaTeX/Reacticle/presentation project. Do not replace a working Beautiful Article / PDF structure with a generic static HTML or a new template just to add assets.

## Input Adapter Scope

Use a small adapter layer before `deep_note.md`. The adapter's job is to preserve source material, provenance, and recoverable assets; it is not the final note.

| Input family | Adapter behavior | Must preserve |
| --- | --- | --- |
| Bilibili / YouTube / BV / watchlater | Current video route: metadata, subtitles or ASR, cover, keyframe candidates, chapters/parts. Reuse reliable platform-subtitle acquisition logic when available. | Title, author, duration, URL/id, subtitle source, timestamps, cover, selected/skipped keyframes. |
| ASR transcript / speech draft / meeting notes | Clean speaker turns, timestamps if present, section boundaries, repeated/noisy text, and uncertain terms. Do not invent video keyframes if no media exists. | Speaker/source roles, claims, decisions, examples, action items, time or page anchors if present. |
| Article / webpage / HTML | Extract main text and meaningful figures/tables. Remove navigation and boilerplate. Use Defuddle or browser extraction when available. | URL, title, author/date when available, headings, links, images, tables, code/formulas. |
| PDF / slides / complex document | Extract text, page anchors, figures, tables, formulas, captions, and layout clues. Use the best available local extractor; Docling/MinerU are optional adapters, not required assumptions. | Page numbers, figure/table ids, captions, formulas, source images, reading order, extraction limitations. |

For now, keep the production path video-first. Non-video inputs are allowed only when the source adapter can produce a traceable `unified_source.md`, metadata, and asset candidates. If a complex PDF requires Docling/MinerU but those tools are not installed or not practical, state the limitation in the run manifest and use the best available local PDF extractor rather than pretending the complex layout was fully recovered.

Minimum source package:

- `unified_source.md`: cleaned source text with headings, timestamps/page anchors, and source-role labels where useful.
- `source_manifest.json`: input type, original path/URL, extraction method, confidence/limitations, and available asset types.
- `asset_manifest.json`: cover/source images/tables/formulas/diagrams/keyframes or explicit skip reasons.

## Knowledge And Visual Architecture

The pipeline has two separate thinking steps after source acquisition:

1. Knowledge reconstruction: turn the source into a coherent Blog-style argument, not a summary dump.
2. Visual expression planning: decide what needs a keyframe/source image, Mermaid diagram, table/chart, formula, code block, quote card, timeline, or callout.

Do not collapse these steps into "convert markdown to HTML/PDF". The final artifact should teach with structure, evidence, and visual rhythm.

Visual selection defaults:

- Multiple objects, variables, stages, risks, or options -> table/chart.
- Process, architecture, causal chain, argument map, timeline, decision tree, or abstract mechanism -> Mermaid first.
- Original visual proof from a video/PDF/slide/webpage -> inspected keyframe/source image.
- Formula/code-heavy material -> formula/code block near the explanation, with variable or parameter explanation.
- Concept that none of the above improves -> text callout or prose; do not add generic decorative illustration.

## Output Modes

If the user explicitly requests a mode, proceed. If ambiguous, ask once.

| User intent | Mode | Deliverables |
| --- | --- | --- |
| "解读成 PDF", "生成讲义", "只要 PDF" | `pdf-only` | `<title>.pdf` |
| "做成 HTML", "beautiful-article", "网页文章" | `article-html-only` | `<title>.html` |
| "做成 presentation", "动态演示", "可录屏网页" | `presentation-only` | `presentation/` and optionally `<title>-presentation.html` |
| "PDF + 长文 HTML" | `pdf-and-article` | `<title>.pdf` and `<title>.html` |
| "长文 HTML + 演示网页" | `article-and-presentation` | `<title>.html` and `presentation/` |
| "全部都要", "完整链路", "all" | `all` | PDF, article HTML, and presentation output |

For modes that include both PDF and article HTML, generate both from the shared `deep_note.md`, `asset_manifest.json`, and renderer-specific briefs. Build the article HTML independently. Render a DeepNote LaTeX PDF by default; export an article-derived PDF instead only when the user wants the PDF to preserve the HTML appearance. Do not treat either PDF as a raw format conversion.

Presentation output is not a long-form article. Convert `deep_note.md` into `article.md` or equivalent source material, then create `script.md`, `outline.md`, and a scene-level storyboard before building the 16:9 presentation.

## Interactive Choice Mode

If the user says anything like "我要自己选", "所有选项让我选", "从头到尾让我选", "解读 + 我要自己选", or "不要替我默认", enter interactive choice mode for that run.

Interactive choice mode rules:

- Do not silently choose defaults. Recommend an option when useful, but wait for the user's answer before continuing past that checkpoint.
- Exception: if the user has explicitly pinned a recurring sub-decision with wording such as "以后不要让我选" or "全部都选 X", treat that exact sub-decision as a persistent override and do not ask it again. Record the override in the run-local config/manifest.
- Ask choices in groups at the point they become actionable. Do not ask late-stage rendering choices before source acquisition has revealed subtitles, video stream availability, duration, and asset candidates.
- Persist every answer in `pipeline.config.yaml`, `plan/plan.md`, `asset_manifest.json`, or another run-local decision file so later steps do not rely on chat memory.
- If the user only answers the first group, continue until the next decision boundary, then stop and ask the next group.
- Learn preferences from repeated user choices, but learned preferences are defaults only for normal mode. In interactive choice mode, still ask.

Choice groups:

| Group | When to ask | Decisions |
| --- | --- | --- |
| 1. Output contract | Before heavy work if not explicit | output mode: PDF / HTML / presentation / combinations; one source item per folder; final language |
| 2. Source acquisition | After metadata/subtitle probe | subtitle priority, ASR fallback, whether to download video stream for keyframes, multi-part handling |
| 3. Depth and structure | Before segment analysis | depth level, section granularity, timestamp density, whether to keep dialogue snippets |
| 4. Asset policy | Before asset extraction/generation | keyframe policy, generated diagrams, tables, cover, slide/PDF asset preservation, AI image use |
| 5. Renderer enrichment | Before renderer briefs | key terms, pull quotes, contextual asset placement, per-output visual density, first-section review target |
| 6. PDF renderer | Before PDF build | Article-derived PDF vs DeepNote LaTeX PDF, figure density, appendix/audit section policy |
| 7. Article renderer | Before Beautiful Article planning | article type, theme, width, image mode, cover, first-spread review requirement |
| 8. Presentation renderer | Before presentation build | narration style, pacing, audio, voice, animation density, 16:9 scene treatment |
| 9. Final delivery | Before final export/copy | export exact artifacts, overwrite policy, include asset manifest/review images, open for visual check |

When not in interactive choice mode, use learned user preferences as defaults but still ask if a choice changes cost, output family, privacy/account access, or final structure.

## Required Workflow

1. Normalize and route the input.
   - Classify the input as video URL, ASR/transcript text, speech/meeting notes, article/webpage, PDF/slides, or mixed material.
   - For Bilibili, extract `BVID` from watchlater/tracking URLs.
   - For YouTube, keep the video id and remove unnecessary tracking parameters when practical.
   - For playlists/series/multi-part Bilibili videos, list parts and ask which parts unless the user already specified.
   - For local files or pasted text, preserve the original path/title and create a run folder before extraction.
   - For mixed inputs, keep source boundaries. Do not merge PDF facts, transcript text, and webpage material into one anonymous blob.

2. Acquire source.
   - For video URLs, read `references/source-acquisition.md` and use `scripts/acquire_video.py` for the initial probe and video/audio/subtitle acquisition. It preserves Bilibili part numbers, checks local dependencies, uses bounded retries, and returns a sanitized acquisition report. Run one video at a time.
   - Browser cookies require a local browser profile. Use the browser already authorized in the conversation, or obtain the user's choice before first accessing a new login profile; pass `--browser edge/chrome/firefox/auto` explicitly. Reuse that authorization for the same task. Do not upload cookies to a cloud client. A client with no local shell/browser access should receive local source files instead.
   - `metadata_ready` only confirms metadata access. `source_ready` confirms the requested source action, not transcript completeness or final-note quality. Inspect report artifacts and validate subtitle coverage before proceeding. `needs_asr` routes to audio + configured ASR, never to title-only notes. If the report has no usable source, report the blocker and preserve the current outputs.
   - For video input, inspect title, author/channel, duration, cover, chapters/分P, and subtitle availability.
   - For video input, prefer official/manual subtitles.
   - If video subtitles are missing or incomplete, obtain audio and run the configured ASR path. Do not silently skip ASR.
   - Keep timestamped SRT/VTT/TXT artifacts in the workdir when timestamps exist.
   - For ASR/transcript/meeting text, clean the text into `unified_source.md` while preserving speaker/source roles, timestamps, decisions, examples, and uncertain terms.
   - For webpage/article input, extract main content and useful images/tables into `unified_source.md` and `asset_manifest.json`, preserving URL and links.
   - For PDF/slides, extract text, page anchors, figures, tables, formulas, and captions with the best available local tool. Record extraction limitations in `source_manifest.json`.
   - For every input family, create or update `source_manifest.json` with extraction method, source provenance, confidence, and missing/skipped asset reasons.
   - In interactive choice mode, stop after metadata/subtitle probing and ask the Source acquisition choices before downloading large video/audio or running ASR.

3. Segment and analyze.
   - Split long materials by chapters, headings, topic boundaries, page sections, speaker turns, or time windows.
   - For each segment record teaching goal, claims, mechanisms, examples, named systems, caveats, figure candidates, and high-signal timestamps.
   - Before writing the final `deep_note.md`, read `references/visual-asset-selection.md` and run an asset-aware planning pass: inspect available `asset_manifest.json`, candidate keyframes, cover, slides/PDF assets, transcript visual cues such as "如图/这里可以看到", and segment-level table/diagram opportunities.
   - Before writing the final `deep_note.md`, read `references/deep-note-blog-prompt.md` and `references/v4-learning-notes.md`. Use them as the default writing and learning-unit rules unless the user provides a newer prompt for that run.
   - Integrate segment notes into a coherent Blog-style `deep_note.md`; do not concatenate chunk summaries.
   - The main body of `deep_note.md` must read like an explanatory Blog essay, not a third-person recap. Avoid repeated scaffolding such as "本节结论", "视频开头讨论", "讲者提到", or "这一部分讲了"; build the reasoning first and place local takeaways after the explanation.
   - Do not repair `deep_note.md` by regex replacement, global speaker-word substitution, or generic paragraph padding. Mechanical fixes such as changing every "讲者" to "叙述者", adding repeated "进一步说..." / "落到实践中..." paragraphs, or inflating every short subsection to satisfy a character threshold fail the pipeline.
   - Speaker/source terms are allowed when they are semantically needed. In courses, interviews, lectures, and podcasts, words such as "讲者", "演讲者", "老师", "嘉宾", "主持人", and "UP 主" can be retained when they clarify the teaching relation, quote provenance, or scene evidence. Do not remove them solely to satisfy a count.
   - Short subsections are acceptable when the source material only supports a concise explanation. Expand only by adding transcript-backed mechanisms, examples, counterexamples, caveats, transition logic, or transferable scenarios. If those are not available, keep the section concise rather than padding it.
   - `deep_note.md` must place asset anchors in context and choose them by intent: `evidence` -> inspected keyframes/source images, `structure` -> Mermaid, and `comparison` -> tables/charts. Use selected keyframes as `【关键帧：asset_id，caption，source_time=xx:xx，intent=evidence，reason=...】`, tables as real Markdown tables or `【表格：table_id，caption，intent=comparison，reason=...】`, diagrams as Mermaid/source blocks or `【插图：diagram_id，caption，intent=structure，reason=...】`, and missing-but-needed visuals as `【截图建议：约 xx:xx，intent=evidence，...】`. Do not hide all assets in `asset_manifest.json` or leave them only for renderer guessing.
   - Keep the `deep_note.md` top-level output sections focused: a content-specific heading beginning with `1. 主体正文` and the exact `2. 判断框架与结论`. Do not add standalone `观点卡片`, `阅读导航`, `背景与问题`, `全文结构图`, `核心概念与术语`, or separate `总结` chapters. The title metadata can carry source facts; the body must carry the argument. Define key terms where they are first needed, place Mermaid diagrams/tables/keyframes/source figures inside the body near the argument they support, and fold final takeaways into the judgment/action framework. Do not mix Arabic and Chinese chapter numbering, do not output writing-rule sections as reader-facing chapters, and do not add a standalone final ASR/OCR/extraction limitations chapter. Older literal `按 Blog 方式重构...` headings remain compatible.
   - Use the V4 learning-unit checklist semantically: reader problem, intuition, mechanism, concrete example, boundary/counterexample, transfer, and a sparse memory hook. Do not expose all seven as mandatory headings or stamp the same cards into every subsection. Dense or consequential claims should normally include a source-backed worked example and boundary when available; if the source cannot support them, keep the section concise or state the evidence gap.
   - For DeepNote LaTeX PDFs, preserve the audited Blog-style teaching flow and top-level section order. Improve print hierarchy and pagination without rewriting the document into a course-handout template.
   - In interactive choice mode, ask the Depth and structure choices before final segment analysis.

4. Build the asset pool.
   - Asset work begins before final `deep_note.md` and is finalized after it. The pre-pass identifies what the note needs; the post-pass extracts/renders/normalizes the actual files and updates `asset_manifest.json` so every DeepNote anchor has a file or an explicit missing/skipped reason.
   - Use cover, inspected frames, tables, concept diagrams, or generated visuals only when they serve a specific argument.
   - Classify each planned body asset by the primary intent from `references/visual-asset-selection.md`: `evidence`, `structure`, or `comparison`. Medium/long videos should normally use at least two distinct intents across the body when the source supports them.
   - Choose by reader job, not visual variety: real evidence > structural understanding > comparison/data. Keyframes are not a fallback decoration; they are evidence. Tables/charts are the first choice for multi-object comparisons. Mermaid is the first choice for processes, architectures, causal chains, timelines, decision trees, argument maps, and abstract mechanisms that benefit from a visual model.
   - For generated organizing visuals, prefer Mermaid source diagrams for concept maps, decision trees, timelines, argument maps, and workflows when they communicate structure better than hand-drawn generic SVGs. Save the `.mmd` source and pre-render it to SVG/PNG/PDF before insertion. Treat Mermaid as the primary diagram asset; SVG/PNG/PDF files are renderer-specific derivatives and must not degrade the visual style.
   - Mermaid or architecture diagrams must summarize the source material's actual variables, mechanisms, examples, constraints, and conclusions. A diagram that only connects generic section labels such as "背景问题 -> 核心概念 -> 论证链条 -> 可迁移框架 -> 总结" fails the asset gate even if it renders correctly.
   - Treat keyframes as a first-class asset type, not an optional afterthought. If a local or downloadable video stream exists, identify subtitle-aligned candidate intervals from chapters/SRT/segment analysis, extract multiple nearby frames per interval, build contact sheets/tiled strips, visually inspect the candidate images, and record selected/skipped decisions.
   - Do not jump from one guessed timestamp to one extracted frame. Bias toward recall first, then down-select. If a slide/whiteboard/animation reveals progressively, search for the final fully populated readable state.
   - Semantic frame names and captions must come after visual inspection. Do not infer a frame's content only from subtitles, filenames, or intended section topic.
   - Do not generate generic concept art or decorative labeled illustrations in the default pipeline. If the user explicitly asks for generated concept art, treat it as a separate user-approved image task rather than silently adding it to the standard asset pool.
   - Keep an asset manifest with at least: `asset_schema_version`, cover, source video/audio/subtitle availability, generated diagrams, tables/charts, candidate keyframes, selected keyframes, skipped keyframes, captions, asset intent, source timestamps, insertion targets, renderer insertion status, and skip reasons. Legacy generated-image entries may be preserved for backward compatibility but must not be generated by default.
   - Do not mark `source.video_available` as `false` just because no local stream is currently present. First record whether video probing/download was attempted. If keyframes are absent, `asset_manifest.json` must contain real evidence such as `video_probe_attempted`, `video_download_attempted`, `video_probe_error`, `video_download_error`, user-disabled keyframes, or visually inspected skipped candidates with reasons. A generic note like "no local video stream" is not enough.
   - For non-video inputs, do not fabricate keyframe availability. Use `source_images`, `pdf_figures`, `tables`, `formulas`, `web_images`, or `generated_diagrams` as the relevant source asset families and record why video-derived keyframes do not apply.
   - Treat `asset_manifest.json` as a renderer contract, not as a loose audit note. Every asset marked `insert: true` must be inserted by each selected renderer where applicable, or the renderer must record an explicit skip reason such as unreadable frame, duplicate concept, unsupported format, or user-approved exclusion.
   - Preserve valuable tables/images from provided slides/PDFs.
   - For PDF/article outputs, preserve images and tables directly when useful.
   - For presentation output, the user's accepted visual image types are Mermaid diagrams and inspected video frames. Mermaid diagrams may be inserted directly as bounded model cards; video frames may be inserted as bounded evidence cards. Other generated pictures are auxiliary only unless explicitly requested. Regardless of type, every visual needs explicit size, safe margins, caption, and layout position; do not paste at natural size or let it dominate the slide by accident.
   - When using `Image` in article HTML, verify the source image is complete and the rendered ratio will not crop important content.
   - In interactive choice mode, ask the Asset policy choices before extracting keyframes or generating diagrams/images.

5. Plan renderer-specific enrichment.
   - Read `references/visual-asset-selection.md` and `references/renderer-enrichment.md`.
   - Create the relevant brief files before rendering: `article_render_brief.md`, `pdf_render_brief.md`, and/or `presentation/storyboard.md` with `script.md` and `outline.md`.
   - Each brief must translate the shared content into that format's reading or viewing experience: key terms, section rhythm, visual density, asset placement, captions, page breaks, scene pacing, and first-screen/first-section review target where applicable.
   - Do not treat `deep_note.md` as the renderer plan. The renderer brief must explain what is emphasized, compressed, visualized, moved, or transformed for the selected output.
   - In interactive choice mode, ask the Renderer enrichment choices before creating these briefs.

6. Render selected output(s).
   - Render from `deep_note.md`, `asset_manifest.json`, selected assets, and the renderer-specific brief. Do not render from `deep_note.md` alone unless the user explicitly requested a raw conversion.
   - `pdf-only`: read `references/pdf-output-families.md`, use `pdf_render_brief.md`, and render the selected PDF family. When PDF is explicitly requested and no family is chosen, default to a DeepNote LaTeX PDF based on `deep_note.md`, `asset_manifest.json`, and reviewed assets.
   - `article-html-only`: read `references/v4-learning-notes.md` and `references/v3-multimodal-html.md`, author `v4_editorial_plan.json` and `v4_study_model.json`, and render V4 learning-note content inside the accepted V3 multimodal interaction shell from `deep_note.md`, `asset_manifest.json`, selected assets, the full transcript, and `article_render_brief.md`. Keep the compatibility schema `v3-multimodal-study-model@1`. Map high-value paragraphs to focused source clips with explicit start/end times; do not attach every paragraph to a whole chapter.
   - `presentation-only`: use `presentation/storyboard.md`, `script.md`, and `outline.md`, then build a 16:9 `presentation/` project. Also create a `file://`-safe flattened HTML by inlining built CSS/JS/assets; Vite's default external module build is not sufficient for local double-click delivery.
   - `pdf-and-article`: render the article HTML from `article_render_brief.md` and render the selected PDF family from `pdf_render_brief.md`. Default to a separate DeepNote LaTeX PDF over the same content and assets. Export an article-derived PDF only when the user explicitly asks to preserve the HTML visual style.
   - `article-and-presentation`: render article HTML and create presentation from the shared content base plus their separate renderer briefs.
   - `all`: render article HTML, the selected PDF family, and presentation, each with its own brief.
   - For this user's article HTML, use the V4 learning-note content profile on the accepted V3 multimodal interaction shell by default. Read both `references/v4-learning-notes.md` and `references/v3-multimodal-html.md`, create a source-faithful `v4_study_model.json`, include the documented `ui` configuration, and render with `scripts/render_v3_multimodal_html.cjs`. Existing V3 models without `ui` must continue to render unchanged. Beautiful Article / Reacticle remains an alternate HTML family only when the user explicitly chooses it. The rejected content-router experiment is not a default or fallback.
   - For PDF, always read `references/pdf-output-families.md` first. Preserve the user's preferred family. A DeepNote LaTeX PDF must preserve the audited content order while rendering Mermaid, tables, formulas, code, and selected frames as print-safe assets. An article-derived PDF must be exported from the final article HTML and labeled as article-derived.
   - In interactive choice mode, ask the renderer-specific choices for every selected output family before rendering.

7. Validate before delivery.
   - Read `references/quality-gates.md` for the required checks.
   - Do not call the task complete until the selected deliverables exist and pass the relevant checks.

8. Package outputs.
   - Read `references/output-contract.md`.
   - Use `scripts/package_outputs.py` when HTML/PDF files need to be copied into the standard Downloads layout.
   - In interactive choice mode, ask Final delivery choices before overwriting existing files or copying final artifacts.

## Relationship To Existing Skills

This skill owns the end-to-end decision flow, output mode, quality gates, and delivery layout. If local skills such as `beautiful-article`, `web-video-presentation`, `pdf`, or `playwright` are installed, reuse their scripts/templates/checklists as implementation aids. Do not depend on their names being present for the final user-facing contract.

Renderer mapping:

| Renderer | Best for | Key intermediate files |
| --- | --- | --- |
| PDF output | study, review, printing, or article-preserving export | `deep_note.md`, `asset_manifest.json`, `pdf_render_brief.md`, `assets/`, HTML or `.tex` depending on PDF family |
| Article HTML | interactive illustrated notes, source review, search, and local video recall | `deep_note.md`, `asset_manifest.json`, full transcript, `article_render_brief.md`, `v4_editorial_plan.json`, `v4_study_model.json`, article assets |
| Presentation HTML | 16:9 clickable/recordable explanation | `deep_note.md`, `asset_manifest.json`, `article.md`, `script.md`, `outline.md`, `presentation/storyboard.md`, `presentation/` |

Do not uninstall working underlying skills until this pipeline has succeeded on several real videos and any scripts/templates still needed from them have been copied or replaced.

## Defaults For This User

- Final language: Chinese unless the user asks otherwise.
- Quality over runtime. Long or dense videos should become real teaching material, not short summaries.
- Default mode is normal mode unless the user explicitly asks to choose options. In normal mode, use the default profile below and do not silently choose cheaper/token-saving shortcuts. If the user says "我要调试", "我要自己选", "给我选项", "从头到尾让我选", "解读 + 我要自己选", or similar, enter interactive choice mode and ask every relevant choice group again.
- Default profile codes: `1E 3A 4A 5A 6C 7A 8A 9A 10A 11A 12B 13A 14A 15B 16C 17A 18D`. Select a PDF family by name only when PDF is requested.
- Default output mode: `article-and-presentation` (`1E`). Produce Beautiful Article / Reacticle HTML plus a high-quality 16:9 Presentation. Do not generate PDF unless the user explicitly asks for PDF.
- Default output root: `~/Downloads/视频解读`.
- Default package shape: one video per folder, title-named files inside.
- PDF default when explicitly requested: DeepNote LaTeX PDF. Preserve `deep_note.md` order and Blog-style argumentation while adding print-safe hierarchy, selected keyframes, rendered Mermaid diagrams, readable tables, formulas, code, cover, and source-time provenance. Use an article-derived PDF only when the user explicitly asks to preserve the HTML visual style.
- Source acquisition default: `3A`. Prefer official/platform subtitles first; if they are missing, incomplete, or unusable, obtain audio and run the configured ASR path. Do not silently skip ASR when no usable transcript exists.
- Pinned keyframe policy: `4A` and `5A`. Always download/use the video stream when possible, extract subtitle-aligned candidate keyframes, build contact sheets, visually inspect candidates, and insert meaningful selected frames. Do not ask this choice again unless the user explicitly disables keyframe extraction for that run.
- Depth and writing defaults: `6C` super-depth analysis and `7A` Blog-style DeepNote using the V4 learning-unit profile. Long/dense videos should become teaching material with argument reconstruction, intuition, mechanisms, worked examples, boundaries, caveats, and transferable frameworks. The body should be written as a Blog article, not a fixed-length summary or repeated card template; expand dense sections only with source-backed material.
- DeepNote repair default: preserve natural Blog prose. Never use generic filler, regex-only cleanup, or global speaker-term substitution to pass validation. The checker is a quality backstop, not a target to game; a concise source-backed subsection is better than a padded generic one.
- Asset defaults: `8A` full asset pool and `9A` Mermaid-first for organizing diagrams. Build cover, selected keyframes, Mermaid concept diagrams, tables/charts, keywords, glossary items, pull quotes, timelines, comparison cards, source anchors, and reader aids when useful. Use the intent priority from `references/visual-asset-selection.md`: evidence keyframes first when the video contains useful visuals; Mermaid for structure; tables/charts for comparison. Preserve `.mmd` sources whenever Mermaid is used; use SVG/PDF/PNG only as renderer-specific derivatives. Do not generate generic concept art by default.
- DeepNote asset default: body text must contain contextual asset anchors and inline material slots before rendering. Do not generate a pure-text DeepNote and expect later renderers to infer all image/table locations.
- Article HTML defaults: `10A` and `11A`, implemented as V4 learning-note content on the accepted V3 multimodal interaction shell. Preserve the shell's product structure: cover hero, contextual evidence, reading path, merged chapter/semantic-transcript timeline, expandable raw ASR, focused paragraph-level source clips with automatic stop/return, search, bookmarks, personal notes with Markdown export, reading progress, and a polished custom local-video player. In V4, chapter header time ranges are non-clickable orientation labels and each chapter defaults to at most one primary source clip; do not duplicate that clip when an adjacent clickable keyframe already recalls the same interval and claim. The merged timeline remains the exhaustive source-recall route. The player must expose `整理字幕` and `逐字字幕` as two explicit choices plus an independent subtitle visibility control; provide 0.75-2x playback speed, bounded seeking and 10-second skip, volume/mute, fullscreen, keyboard controls, persisted preferences, an always-visible close button, and a Bilibili-like focus mode that collapses subtitles and menus without losing state. Do not render a duplicate `Video Chapters` list inside the player because article navigation and contextual source links already provide chapter/segment seeking. Cleaned subtitles must cover every raw ASR segment that contains speech; uncovered speech is a hard renderer failure, not a reader-facing placeholder. Create `v4_editorial_plan.json` and `v4_study_model.json` as editorial layers; do not mechanically map DeepNote headings into broad chapters. Use humanized reader labels such as `原片` and `结构图`, while internal ids remain in the model/report. Beautiful Article / Reacticle is alternate-only when explicitly selected. Do not use the rejected content-router experiment.
- V4 article navigation default: use the sticky left reading path as the single chapter directory. Keep a concise lead orientation, but set `show_thesis_map: false` so the article opening does not repeat the same chapter list. Set `compact_source_clips: true`; show only `原片 + 时间范围 + 时长` on the button and preserve the editorial reason in its tooltip and accessibility label.
- V4 hero default: use the hero deck for one 25-55-character content thesis that compresses the video's core judgment. Do not use it to explain the webpage, the note-generation method, source recall, or reading features.
- Presentation defaults: `12B`, `14A`, and `15B`. Use the high-quality Presentation renderer only, target 20-40 staged 16:9 steps with complete `script.md`, `outline.md`, and `storyboard.md`, use Mermaid diagrams and inspected video frames as the primary visual assets, keep every visual in a bounded card/frame with explicit layout position, auto-select theme by content, and ask whether to synthesize audio after the web presentation is built.
- Review defaults: `13A` and `16C`. When practical, create the first chapter / first 3-5 Presentation steps as an acceptance anchor before full rendering. For Article HTML, first-screen plus first section is the normal acceptance target when the user asks to review.
- Delivery defaults: `17A` and `18D`. Use `~/Downloads/视频解读/<BVID-标题>/`, write title-named files, keep assets and manifests in the same video folder, and ask before overwriting existing final artifacts.
- If a browser-rendered HTML is produced, keep it single-file whenever practical. If external assets are required, place them inside the same video folder and verify links.
- If a presentation is produced, keep it in `presentation/` inside the video folder and provide a local-openable `<title>-presentation.html` whenever practical. For Vite/React presentation builds, run `scripts/inline_presentation_html.py` on the built `dist/` and package that flattened HTML; otherwise local `file://` opening may show a blank page.
