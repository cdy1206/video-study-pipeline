# PDF LaTeX Renderer Contract

Use this reference whenever a selected output mode includes a normal PDF lecture note. This renderer is the default for "PDF", "讲义", "解读成 PDF", or "字幕讲义" requests.

This renderer must stay compatible with the current `wdkns/wdkns-skills` `bilibili-render-pdf` / `youtube-render-pdf` logic. Do not call an output "official-style" merely because it compiles with LaTeX. It must follow the official course-note structure, figure-selection discipline, template family, source-time provenance, and final delivery expectations.

## Renderer Inputs

Required inputs:

- `deep_note.md`: the unified transcript-backed content base.
- `assets/asset_manifest.json`: binding visual/data asset contract.
- `assets/`: cover, selected keyframes, generated diagrams, tables, and preserved source figures.
- timestamped transcript: `transcript_final.srt`, `.vtt`, or equivalent.
- a LaTeX note template. Prefer, in order:
  1. installed `wdkns/wdkns-skills` `bilibili-render-pdf/assets/notes-template.tex` or `youtube-render-pdf/assets/notes-template.tex`
  2. this pipeline's `assets/notes-template.tex`
  3. an explicitly user-approved legacy template

Do not render the PDF directly from Beautiful Article HTML unless the user explicitly asked for article-derived PDF.

## Asset Manifest Shape

The manifest should be machine-readable JSON when possible. Minimum useful fields:

```json
{
  "asset_schema_version": "1.0",
  "source": {
    "platform": "bilibili",
    "video_id": "BV...",
    "title": "...",
    "video_available": true,
    "subtitle_source": "official|asr|manual"
  },
  "cover": {
    "path": "assets/cover.jpg",
    "insert": true,
    "target": "frontmatter"
  },
  "selected_keyframes": [
    {
      "id": "kf-001",
      "type": "keyframe",
      "path": "assets/keyframes/kf-001.jpg",
      "source_time": "00:08:47",
      "source_interval": "00:08:40-00:09:05",
      "target_section": "创业方案的真实约束",
      "target_subsection": "开场咨询场景",
      "caption": "原视频开场画面，保留咨询语境。",
      "insert": true,
      "reason": "establishes source scene",
      "tex_label": "fig:kf-001"
    }
  ],
  "generated_diagrams": [
    {
      "id": "diag-001",
      "type": "diagram",
      "path": "assets/diagrams/diag-001.svg",
      "target_section": "核心机制",
      "caption": "概念关系图。",
      "insert": true
    }
  ],
  "tables": [
    {
      "id": "tbl-001",
      "type": "table",
      "target_section": "比较与取舍",
      "caption": "关键变量对照表。",
      "insert": true,
      "rows": []
    }
  ],
  "skipped_keyframes": [
    {
      "id": "kf-skip-001",
      "source_time": "00:12:10",
      "insert": false,
      "reason": "generic talking-head frame"
    }
  ]
}
```

Every `insert: true` asset is binding for the PDF renderer unless the renderer writes a concrete skip reason back into the manifest or a renderer report.

## Rendering Rules

- Insert the video cover in front matter or the first page when available.
- Insert selected keyframes, generated diagrams, preserved source images, and tables near the section/subsection they support. Do not move them to a generic asset appendix unless the user explicitly asked for an appendix.
- Video keyframes need a caption plus concrete source time interval as a same-page footnote. A caption-only `视频时间：...` suffix is a fallback for non-LaTeX renderers, not sufficient for official-compatible LaTeX PDF output.
- Generated diagrams must be labeled as generated/整理图 when they are not original video frames.
- Tables should be real LaTeX tables (`tabular`, `longtable`, `booktabs`) when they are text/data. Dense visual tables may be included as rendered image/PDF only if the source remains readable.
- Do not put figures inside `tcolorbox`/quote/callout boxes; this often creates clipping and layout instability.
- Do not rely on a single cover image. A figure-rich lecture handout should include contextual body figures whenever the manifest has selected keyframes or diagrams.
- End every major `\section{...}` with `\subsection{本章小结}` unless the section is front matter, a table of contents, or the user explicitly requested a non-course-note format.
- Add `\subsection{拓展阅读}` only when one or two worthwhile external links genuinely improve the note. Do not invent links just to satisfy a section pattern.
- Use `importantbox`, `knowledgebox`, `warningbox`, and `dialoguebox` only for high-signal teaching payloads. Routine exposition stays in normal prose.
- For conversation-heavy videos, preserve short high-signal original dialogue in `dialoguebox` when exact wording adds presence, intuition, humor, or unusually compact information. Do not dump long transcript blocks.

## Official-Compatible Frame Selection

Frame selection must be evidence-driven:

- Use timestamped SRT/VTT as the primary locator. Identify the subtitle span for the concept/example/formula/visual before extracting frames.
- Extract multiple nearby frames across the subtitle-aligned interval and slightly around its boundaries. Do not jump from one guessed timestamp to one frame.
- Build contact sheets, montages, or tiled strips to maximize recall.
- Inspect candidate frames visually before semantic naming, captioning, or insertion. OCR may assist, but it is not a substitute for visual understanding.
- For progressive slides, whiteboards, dashboards, or animations, search for the final fully populated readable state.
- Prefer the most complete and readable nearby frame. Reject partially revealed, transitional, ambiguous, or low-information frames.
- Crop/enlarge only when necessary for readability, and keep the source interval tied to the original video frame.

Recommended LaTeX pattern for a keyframe:

```tex
\begin{figure}[H]
\centering
\includegraphics[width=0.92\textwidth]{assets/keyframes/kf-001.jpg}
\caption{原视频开场画面，保留咨询语境。\protect\footnotemark}
\label{fig:kf-001}
\end{figure}
\footnotetext{视频时间区间：00:08:40--00:09:05。}
```

Use `[H]` only when the template supports `float`; otherwise use a stable placement pattern that keeps the time note close to the figure.

## Format Conversion

- LaTeX engines usually handle `.pdf`, `.png`, `.jpg`, and `.jpeg` reliably.
- Convert SVG diagrams to PDF before inclusion when possible, for example with `rsvg-convert`, `inkscape`, or `magick`.
- Prefer vector output (`.pdf`) for generated plots, charts, schematic diagrams, and teaching figures. PNG is acceptable only when the content is inherently raster or vector conversion is unavailable; document the fallback in the renderer report or manifest.
- If an asset path contains unsafe characters or spaces that break LaTeX, copy or symlink it to a safe filename under `assets/latex/`.

## Required PDF Audit

Before delivery:

- `.tex` references every inserted asset basename from `asset_manifest.json`.
- Body figure count is greater than zero when the manifest has `insert: true` keyframes/diagrams beyond the cover.
- `\includegraphics` count is greater than one when both cover and body assets are expected.
- Each inserted video frame has caption text plus a concrete source time interval in `\footnotetext{...}` or an equivalent same-page footnote mechanism.
- Major sections end with `\subsection{本章小结}` unless a documented exception applies.
- The `.tex` was generated from an official-compatible `notes-template.tex`, not from a generic article template.
- LaTeX compile log has no missing file errors.
- Use `pdfimages -list`, `mutool info`, or rendered page PNG/contact sheet to confirm embedded images appear beyond the cover when tooling is available.
- Render representative pages and inspect for blank pages, clipped images, unreadable text, missing CJK glyphs, and large unintended whitespace.
- Run `scripts/check_pdf_latex_official_alignment.py --tex <file> --manifest <asset_manifest.json>` when practical.

## Failure Conditions

Treat the PDF build as failed, not "good enough", when:

- `asset_manifest.json` exists with inserted body assets but the final `.tex` references none of them.
- the final PDF contains only the cover image while selected keyframes/diagrams/tables were available for insertion.
- keyframes were never considered even though a local/downloadable video stream was available.
- candidate frame selection used one guessed timestamp per target without dense nearby candidates or contact sheet inspection.
- the renderer silently exports Beautiful Article HTML to PDF for a generic PDF request.
- generated diagrams replace all original keyframes without an explicit reason.
- video frame time provenance is caption-only and no same-page footnote/equivalent exists.
- major sections lack `\subsection{本章小结}` without documented user-approved exception.
- figure placement makes images clipped, cropped, blank, or detached from the relevant explanation.
