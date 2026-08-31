# Quality Gates

## Source Integrity

- Metadata inspected: title, author/channel, duration, platform id, cover when available.
- Transcript exists before final writing.
- If no official subtitle exists, ASR was attempted and the result is timestamped.
- Transcript coverage is sufficient for the full requested video/part.
- Provided slides/PDFs are used as support, not as a substitute for transcript-backed explanation.

## Content Depth

- The output teaches the video without requiring the user to watch it.
- Long or dense videos are not collapsed into a shallow outline.
- Major time blocks or chapters are represented by substantive sections.
- `deep_note.md` follows the focused Blog-style section order from `references/deep-note-blog-prompt.md`: a content-specific heading beginning with `1. 主体正文` and the exact `2. 判断框架与结论`, with no standalone `观点卡片`, `阅读导航`, `背景与问题`, `全文结构图`, `核心概念与术语`, separate `总结`, mixed `八/九/十` top-level numbering, or standalone final ASR limitations chapter. Older literal `按 Blog 方式重构...` headings remain compatible.
- `deep_note.md` body reads like a Blog article, not a third-person video recap. The main body should not repeatedly use report scaffolding such as "本节结论", "视频开头讨论", "讲者提到", "这一部分讲了", or "本节主要介绍".
- `deep_note.md` does not contain generic padding inserted to satisfy length checks. Repeated paragraphs such as "进一步说，X 不应该被读成一句孤立结论..." or "落到实践中，这一层至少要追问三件事..." fail the content gate.
- Source-role terms are judged semantically, not by raw count. In courses, interviews, lectures, and podcasts, "讲者", "演讲者", "老师", "嘉宾", "主持人", "受访者", and "UP 主" may appear when they clarify provenance, teaching relation, quote attribution, or visual scene evidence.
- Mechanical cleanup fails the content gate. Do not globally replace speaker terms, use regex-only prose repair, or introduce malformed wording such as "演叙述者".
- In `## 1. 主体正文`, local takeaways should normally come after reasoning, examples, and mechanisms. Do not front-load every subsection with a labeled conclusion.
- Subsections should not all have the same short summary shape. Dense sections need developed paragraphs that explain mechanism, example, implication, and transition. However, concise subsections are acceptable when the source only supports a compact point; do not pad them just to pass a character threshold.
- For the V4 learning-note profile, important chapters resolve a real reader question and teach a mechanism rather than merely restating a thesis. Dense or consequential claims should include a source-backed worked example and a boundary, counterexample, or failure condition when the source supports them.
- V4 semantic blocks such as `worked-example`, `boundary-note`, `memory-line`, and `formula-card` are optional. They must add scan value, remain source-backed, and not repeat the surrounding prose. Repeating the same card sequence in every subsection fails the content gate.
- Memory hooks are sparse and content-specific. Generic slogans, motivational filler, or a paraphrase of the preceding conclusion do not count as a learning aid.
- Checker counts and structural checks do not prove V4 teaching quality. A human semantic review must verify mechanisms, examples, boundaries, and transfer guidance against the transcript or source package before delivery.
- `deep_note.md` is asset-aware. It includes contextual asset anchors, inline tables, Mermaid/source diagrams, screenshot suggestions, quote/code/formula blocks, or other renderer-consumable material slots where they support the argument.
- Body assets follow `references/visual-asset-selection.md`. Planned assets identify or clearly imply their primary intent: `evidence`, `structure`, or `comparison`.
- Medium/long videos should normally include at least two distinct asset intents across the body when source material supports them. A single decorative keyframe or a single generic diagram does not satisfy the asset-aware requirement.
- If `asset_manifest.json` contains `insert: true` keyframes, diagrams, or tables, the corresponding ids or clearly matching placeholders appear in `deep_note.md` near the relevant section, or the renderer report records why the note could not place them.
- `## 1. 主体正文` should not be pure prose for medium/long videos when useful assets exist. Keyframes, tables, Mermaid diagrams, screenshot suggestions, code/formula blocks, or decision/checklist assets should appear contextually in the body rather than only near the opening or in an appendix.
- Keep mechanisms, examples, named systems, formulas/code, caveats, comparisons, and speaker conclusions.
- For LaTeX PDF lecture notes, major sections end with `\subsection{本章小结}` unless a documented user-approved exception applies.
- For LaTeX PDF lecture notes, writing follows a teaching sequence: motivation, main idea, mechanism, example/evidence, and takeaway where applicable. Do not dump subtitles in chronological order.
- If a short output is intentional, label it as brief/preview; do not call it a deep handout.

## HTML Checks

- Build succeeds.
- `article_render_brief.md` exists unless the user explicitly requested raw export.
- HTML opens locally.
- Console has no blocking errors.
- No broken images.
- If the article is produced through Beautiful Article / Reacticle, preserve that structure: one assembler article, section components, theme tokens, TOC/Hero/Lead rhythm, and `Image`/`Raw` components for assets. Do not silently replace it with a hand-written static template.
- Every `Image` source is complete.
- Explicit image `ratio` values match natural image ratio, or are omitted when preserving natural aspect is safer.
- Rendered image audit shows no obvious cropping, missing corners, or blank assets.
- Inline images and diagrams are size-constrained by a designed frame; normal body figures do not default to full-width/full-page treatment.
- Selected keyframes, generated diagrams, and tables are inserted near the section they support; a visible front-loaded asset table is not a substitute for contextual placement.
- No reader-facing generic "资产说明", "assets used", or asset audit block appears in the final article unless the user explicitly asked for an audit appendix.
- For the default V4 profile, the accepted V3 interaction shell remains intact: search, bookmarks, personal notes/export, reading progress, merged chapter/transcript timeline, raw ASR expansion, focused source clips, and local-video seeking all work.
- The custom player exposes `整理字幕` and `逐字字幕` as direct choices, keeps subtitle visibility as a separate control, and preserves playback speed, seeking, 10-second skip, volume/mute, fullscreen, and close controls.
- The custom player does not repeat a chapter list already available in the article navigation and merged chapter/transcript route.
- Split-player mode sizes to its actual media, subtitle, and control content instead of stretching to the viewport and leaving a blank lower panel; on short screens it uses a viewport-bounded scroll container.
- Focus mode hides the subtitle and full control panels without deleting their state, preserves the always-visible player close button, exposes an exit control on pointer activity or pause, and restores the complete player when exited.
- V4 reader-facing asset labels use `原片` and `结构图` rather than internal asset ids. Worked examples, boundary notes, memory hooks, and formula cards are visually distinct, responsive, and do not overflow.
- The default V4 reading view has one chapter directory: the sticky left reading path. It does not repeat the same chapter list in the article opening. Chapter header time ranges are non-interactive orientation labels. Each chapter has at most one primary source-clip button by default; a nearby clickable keyframe must not duplicate the same interval and claim. Source-clip buttons remain compact; the visible label contains source, time range, and duration, while the full editorial reason remains available through tooltip and accessibility text.
- The V4 hero deck states the video's central judgment or causal relationship in roughly 25-55 Chinese characters. It does not waste the cover on product descriptions such as `精读笔记`, `本文将`, `重构`, `回到原片`, or `帮助你快速了解视频`.

## Asset Checks

- `assets/asset_manifest.json` or `assets/asset_manifest.md` exists in the workdir before rendering.
- The manifest distinguishes cover, generated diagrams, tables, selected keyframes, and skipped keyframes.
- The manifest records asset intent for body assets where practical: `evidence` for keyframes/source images, `structure` for Mermaid/architecture/process diagrams, and `comparison` for tables/charts.
- Mermaid diagrams are tracked as first-class source assets when used: preserve `.mmd` when available, record rendered SVG/PDF/PNG derivatives separately, and prefer the Mermaid-styled rendered asset over low-quality PNG fallbacks for HTML and Presentation.
- Mermaid and architecture diagrams are content-bearing, not decorative. A diagram fails if it only connects generic section labels such as "背景问题", "核心概念", "论证链条", "可迁移框架", and "总结" without the video's actual variables, mechanisms, examples, constraints, or conclusions.
- Multi-object comparisons are represented as tables/charts or have a documented reason why table/chart form would be worse.
- The default pipeline does not generate generic concept art or decorative labeled illustrations. Legacy generated-image entries may remain readable for backward compatibility, but new runs should use keyframes, Mermaid, tables/charts, or text callouts.
- The manifest is a renderer contract, not only an audit log. Every `insert: true` asset has a target section/subsection and is consumed by each selected renderer where applicable.
- If an `insert: true` asset is not consumed by a renderer, the renderer records an explicit skip reason. Silent omission fails the asset gate.
- If a video stream is available, candidate keyframes were extracted from timestamped source moments and visually inspected.
- Candidate keyframe selection uses subtitle-aligned intervals and multiple nearby candidates, not one guessed timestamp per target.
- Contact sheets, montages, or tiled strips exist for candidate recall when the video has useful visuals.
- Semantic frame names and captions were assigned after visual inspection. They are not inferred only from subtitles, filenames, or intended section topics.
- For progressive reveals, whiteboards, or animation builds, the selected frame is the final complete readable state when available.
- Skipped keyframes record a reason, such as generic talking-head frame, unreadable subtitle, low concept value, or redundant with a generated diagram.
- Selected keyframes are evidence assets. A selected keyframe fails the asset gate if its reason is only avoiding monotony, adding atmosphere, filling layout space, or decoration.
- If no keyframe is inserted, the reason is documented with real acquisition evidence: user disabled keyframes, video probe/download was attempted and failed, login/copyright/network prevented stream access, or all visually inspected candidates were skipped with reasons. A generic note such as "no local video stream" is not enough.
- Contact sheets or preview images exist for visual audit when keyframes/figures are used.

## Renderer Enrichment Checks

- For every selected output, the relevant renderer brief exists unless the user explicitly requested raw export.
- `article_render_brief.md`, `pdf_render_brief.md`, or `presentation/storyboard.md` records target reader, renderer family/style route, section-level adaptation plan, asset usage map, key terms/keywords, visual density, and review target where applicable.
- Renderer briefs include an asset intent map and explain why the chosen visual form is appropriate for each key placement.
- Final output is not a direct one-to-one format conversion from `deep_note.md`. It shows renderer-specific organization, visual rhythm, and asset treatment.
- Keywords, key terms, pull quotes, diagrams, tables, keyframes, or reader aids are surfaced contextually where useful; they are not only listed in a manifest or appendix.
- HTML, PDF, and presentation outputs do not share one generic layout plan. Each selected format has a distinct treatment: article reading flow, print handout flow, or 16:9 staged explanation.
- Every selected `insert: true` asset is either placed in the renderer-specific brief and final output, or has a renderer-specific skip reason.
- Generated visuals are topic-specific and section-specific. A repeated generic image across unrelated videos fails this gate unless the user asked for a common brand motif.

## Presentation Checks

- `script.md` exists and is written as platform-ready narration, not copied long-form prose.
- `outline.md` exists and contains chapter boundaries, step estimates, information pools, and a material list.
- `presentation/storyboard.md` or equivalent scene plan exists and maps content, narration, and assets to 16:9 scenes.
- Missing images/tables are represented as explicit placeholders; do not fake unavailable assets.
- Tables and dense figures are transformed into readable 16:9 scenes, cards, highlights, or progressive reveals.
- The primary accepted presentation image assets are Mermaid diagrams and inspected video frames. Other generated images should be used only as auxiliary visuals or when explicitly requested.
- Mermaid diagrams may appear directly in presentation as model cards. They must keep their Mermaid structural clarity, use the highest-quality rendered source available, and remain bounded inside the slide layout.
- Every visual asset is placed in a bounded frame/card with explicit maximum dimensions, safe margins, and a caption or label. Raw screenshots or diagrams must not be pasted at natural size.
- No visual asset should dominate a slide by default. Full-slide images are allowed only when intentionally designed as the slide background or hero and reviewed as complete and readable.
- First chapter is built as a real style anchor and user-reviewed when practical.
- Each chapter has visual treatment beyond plain text: CSS, SVG, canvas, staged layout, animation, or meaningful progressive reveal.
- `narrations.ts` is the step-count source of truth; visible steps and narration entries stay aligned.
- TypeScript/build checks pass for the presentation project.
- The delivered presentation HTML opens from `file://`; do not rely only on Vite default external `type="module"` asset links.
- If packaging a flattened presentation, inline built CSS/JS and local image assets, then verify no `src="./assets/"`, `href="./assets/"`, or `/assets/` references remain in the flattened HTML.
- If audio is generated, `audio-segments.json` exists and segment count matches narration steps.
- If the goal is recording, verify manual or `?auto=1` playback path is clear.

## PDF Checks

- PDF file exists and is title-named.
- `pdf_render_brief.md` exists unless the user explicitly requested raw export.
- Page count is plausible for the source length and selected output mode.
- Text can be extracted from representative pages.
- Embedded images are present when the HTML/source contains images.
- If regenerating an existing PDF that the user liked, preserve the prior document family and structure unless the user approved a redesign.
- PDF family matches `references/pdf-output-families.md` and the user's wording: DeepNote article-derived PDF, DeepNote LaTeX PDF, or official LaTeX lecture handout.
- Article-derived PDFs have a source HTML file, were exported through browser print/PDF, preserve selected HTML assets, and have acceptable page breaks after visual inspection.
- DeepNote LaTeX PDFs preserve the `deep_note.md` top-level section order and do not restructure into official lecture-handout form.
- Mermaid, Graphviz, charts, and other code-defined visuals are rendered as visual assets before PDF export. The final PDF must not show Mermaid source code such as `flowchart TD` unless the video is specifically teaching Mermaid syntax.
- Diagrams and key visual assets are not split across pages. If a diagram is too large, scale it, rotate it, or place it on its own page.
- Normal body figures are size-constrained and do not consume an entire page unless the renderer brief explicitly marks them as full-page plates.
- Complex tables remain readable: use styled HTML tables, LaTeX `longtable`/controlled-width columns, or reviewed visual table assets. A table that overflows, clips, or becomes unreadable fails the PDF gate.
- Official LaTeX lecture handouts use the official-compatible renderer only when that family is selected or clearly requested.
- LaTeX lecture handouts use an official-compatible `notes-template.tex`: installed `bilibili-render-pdf` / `youtube-render-pdf` template when available, otherwise this pipeline's fallback template.
- For LaTeX lecture handouts, figures from the asset manifest must be inserted through the LaTeX figure pipeline; do not replace the handout with an article-style PDF solely to add assets.
- If `asset_manifest.json` has `insert: true` body assets, the final `.tex` references their basenames or records explicit renderer skip reasons.
- `\includegraphics` count is greater than one when both cover and body images are expected. A cover-only PDF fails when selected keyframes/diagrams/tables exist.
- Body figure/table count is cross-checked against the manifest, excluding the cover.
- Every inserted video keyframe has a caption and a concrete source time interval in a same-page footnote or equivalent mechanism. Caption-only time suffix is not sufficient for official-compatible LaTeX PDF.
- Major sections contain `\subsection{本章小结}` unless documented exceptions apply.
- `scripts/check_pdf_latex_official_alignment.py` passes when practical.
- Generated diagrams are visibly identified as generated/整理图 when they are not original keyframes.
- Generated teaching figures use vector PDF where practical; PNG fallbacks are documented in the renderer report or manifest.
- Use `pdfimages -list`, `mutool`, or rendered pages to confirm embedded images beyond the cover when tooling is available.
- Render pages to PNG when tooling is available and inspect a contact sheet for blank pages, image clipping, unreadable glyphs, and large unintended whitespace.

## Delivery Checks

- Final artifacts are copied to `~/Downloads/视频解读/<video-id>-<safe-title>/`.
- File names use the video title, not generic names like `article.pdf` or `notes.pdf`.
- If both outputs are requested, HTML and PDF are in the same video folder.
- If presentation output is requested, `presentation/` and, when practical, a `file://`-safe `<safe-title>-presentation.html` are in the same video folder.
- Report the final clickable paths.
