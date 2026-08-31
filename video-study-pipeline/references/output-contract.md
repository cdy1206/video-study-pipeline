# Output Contract

## Standard Location

Put final user-facing artifacts under:

`~/Downloads/视频解读/<video-id>-<safe-title>/`

Use one folder per video. Do not put final deliverables on the Desktop unless the user explicitly asks.

## File Names

Inside each video folder, use the video title as the file stem:

- `<safe-title>.html`
- `<safe-title>.pdf`
- `<safe-title>.tex` when a DeepNote LaTeX PDF was generated
- `deep_note.md` when practical
- `transcript_final.srt` / `transcript_final.vtt` when practical
- `renderer_report.json` when practical
- `<safe-title>-presentation.html` when a flattened presentation HTML export exists
- `presentation/` for the editable/runnable 16:9 presentation project

Rules for `safe-title`:

- Preserve Chinese characters.
- Remove filesystem-unsafe characters: `/ \ : * ? " < > |` and control characters.
- Collapse repeated whitespace.
- Remove decorative emoji unless it identifies the video.
- If the title is too long, shorten to the clearest topic.

Rules for folder name:

- Prefer `<BVID>-<safe-title>` for Bilibili.
- Prefer `<youtube-id>-<safe-title>` for YouTube.
- If no id is available, use `<safe-title>`.

## Assets

Prefer single-file article HTML. If external article/PDF assets are necessary:

- create `assets/` inside the video folder
- copy only assets actually referenced by the final HTML/PDF
- verify relative links after copying

For video-study packages, keep the full reviewed asset pool in the workdir and expose at least the asset manifest in the final folder when practical:

- `assets/asset_manifest.json` or `assets/asset_manifest.md`
- selected keyframes, generated diagrams, rendered table assets, and preserved source figures when they are referenced by the final PDF/HTML
- enough metadata in `metadata.json` to find the workdir asset pool if the final HTML is single-file and assets are embedded

The final folder should let the user answer "which frames/figures/tables did you use, and which keyframes did you skip?" without reading the chat transcript.

For DeepNote LaTeX PDF output:

- expose `<safe-title>.tex` when available
- expose `assets/asset_manifest.json`
- expose the asset files referenced by `\includegraphics` or table rendering
- expose the final timestamped transcript when available
- expose `renderer_report.json` or an equivalent report containing template choice, inserted assets, vector/raster conversion fallbacks, and visual-review status
- expose `review/pdf-pages-1-6.png` or an equivalent rendered visual audit image when available
- do not expose only a PDF if asset-rich rendering was part of the requested mode

For presentation output:

- put the runnable project in `presentation/`
- keep presentation images, audio, and generated assets under that project, usually `presentation/public/`
- use explicit placeholder assets or placeholder scenes when real materials are missing
- do not mix presentation implementation files into the article assets directory
- provide a flattened `<safe-title>-presentation.html` when practical
- for Vite/React presentation builds, flatten with `scripts/inline_presentation_html.py` so the user can open the file directly from Finder or `file://`

## Packaging Script

Use:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/video-study-pipeline/scripts/package_outputs.py" \
  --title "<VIDEO_TITLE>" \
  --video-id "<BVID_OR_YOUTUBE_ID>" \
  --html "<path/to/article.html>" \
  --pdf "<path/to/article.pdf>" \
  --tex "<path/to/deepnote-print.tex>" \
  --deep-note "<path/to/deep_note.md>" \
  --subtitle "<path/to/transcript_final.srt>" \
  --asset-manifest "<path/to/assets/asset_manifest.json>" \
  --asset-dir "<path/to/assets>" \
  --renderer-report "<path/to/renderer_report.json>" \
  --review-file "<path/to/pdf-pages-1-6.png>" \
  --presentation "<path/to/presentation-dir>" \
  --presentation-html "<path/to/presentation.html>" \
  --overwrite
```

Pass only the artifacts produced for the selected mode. For example, pass `--pdf --tex --deep-note --subtitle --asset-manifest --asset-dir` for a complete DeepNote LaTeX PDF package, only `--presentation` for `presentation-only`, or all relevant arguments for `all`.

When the presentation project was built by Vite, first create the local-openable flattened HTML:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/video-study-pipeline/scripts/inline_presentation_html.py" \
  --dist "<path/to/presentation/dist>" \
  --out "<path/to/<safe-title>-presentation.html>" \
  --title "<VIDEO_TITLE>"
```

Then pass that file as `--presentation-html`.
