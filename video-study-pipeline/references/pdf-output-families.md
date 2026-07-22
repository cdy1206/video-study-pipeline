# PDF Output Families

Use this reference before rendering any PDF output.

The pipeline supports three PDF families. Pick the family from the user's wording and the selected output mode. Do not silently substitute one family for another.

Before rendering any PDF family, read `renderer-enrichment.md` and create `pdf_render_brief.md` unless the user explicitly requested raw conversion. PDF is a print-specific study artifact, not a bare `deep_note.md` export.

## 1. DeepNote Article-Derived PDF

Use when the user says:

- keep `deep_note.md` 原样;
- HTML + PDF;
- Blog PDF;
- 网页版顺便导出 PDF;
- beautiful article PDF;
- 保持网页观感;
- 不要官方 LaTeX 讲义结构.

Route:

`deep_note.md -> article HTML -> browser print/export PDF`

This is the best fit when the user wants the PDF to look like the HTML article and preserve the Blog-style reading order.

Requirements:

- build the article HTML first;
- use `article_render_brief.md` for the article and `pdf_render_brief.md` for print-specific adjustments;
- include the same selected keyframes, figures, diagrams, and tables used by the HTML;
- pre-render Mermaid, Graphviz, charts, complex diagrams, and other code-defined visuals into stable SVG/PNG/PDF assets before PDF export; do not rely on browser-live Mermaid during print when pagination matters;
- keep each diagram as a single unbroken figure block where possible, scaling it to fit one page instead of splitting it across pages;
- render complex tables as styled HTML tables when they remain readable; if a table is too dense or too wide, turn it into a reviewed visual table asset and insert it as a figure;
- use print CSS or browser PDF settings to avoid cropped images and awkward page breaks;
- export with Playwright/Chromium or equivalent browser print, not a plain Markdown converter;
- label this as article-derived PDF in the run manifest or delivery note.

Tradeoff:

- best visual consistency with HTML;
- less typographically strict than a hand-tuned LaTeX handout;
- page breaks may need browser/PDF audit.

## 2. DeepNote LaTeX PDF

Use when the user says:

- convert DeepNote directly to PDF;
- keep DeepNote section order but use LaTeX;
- printable DeepNote;
- LaTeX is okay, but do not restructure into official lecture notes.

Route:

`deep_note.md -> LaTeX preserving 0-5 DeepNote section order -> PDF`

This is a middle path. It keeps the DeepNote content structure but uses LaTeX for PDF typography.

Requirements:

- preserve the `deep_note.md` top-level order and headings;
- use `pdf_render_brief.md` to define print hierarchy, reader aids, asset placement, and pagination strategy;
- do not rewrite the document into official course-note sections;
- include selected assets near their original DeepNote insertion targets;
- pre-render Mermaid, Graphviz, charts, complex diagrams, and other code-defined visuals into PDF/PNG assets before LaTeX compilation; do not print Mermaid or diagram source code in the PDF;
- include diagrams with `\includegraphics` and `keepaspectratio`, scaling each diagram to fit within one page;
- render Markdown tables as real `longtable`/`tabular` tables with controlled column widths and smaller font when needed; if a table is too complex to remain readable as text, render it as a visual table asset;
- use stable LaTeX figure/table handling;
- do not force every section to end with `本章小结` unless the DeepNote already has that rhythm or the user asks for course-note treatment.

Tradeoff:

- better print typography than browser PDF;
- less visually faithful to HTML;
- more conversion work for Mermaid, tables, callouts, and rich layouts.

## 3. Official LaTeX Lecture Handout

Use when the user says:

- official-style PDF;
- LaTeX lecture handout;
- 课程讲义;
- 字幕讲义;
- wdkns / bilibili-render-pdf / youtube-render-pdf style;
- preserve a previous official-style PDF the user liked.

Route:

`deep_note.md + asset_manifest.json + assets/ -> official-compatible notes-template.tex -> PDF`

This is the original renderer family. It may restructure the Blog-style DeepNote into a more course-note-like document.

Requirements:

- read `references/pdf-latex-renderer.md`;
- use `pdf_render_brief.md` to map shared assets, key terms, and teaching aids into the official lecture-handout structure;
- use an official-compatible `notes-template.tex`;
- include cover, keyframes, diagrams, tables, and same-page source-time footnotes;
- add `本章小结` to major sections unless the user explicitly disables course-note structure.

Tradeoff:

- best for printable lecture notes;
- not the best choice when the user asks to preserve DeepNote/HTML structure exactly.

## Default For This User

The normal default output profile is **Article HTML + high-quality Presentation**, so no PDF is generated unless the user explicitly asks for PDF.

When the user explicitly asks for PDF and does not choose another PDF family, the user's current default is **Official LaTeX Lecture Handout**. However, the content source must be `deep_note.md` plus `asset_manifest.json` and reviewed `assets/`, not a shallow subtitle-summary note. Map the Blog-style DeepNote into the official-compatible `notes-template.tex` while preserving depth, selected keyframes, cover, Mermaid diagrams, tables, terms, examples, source-time footnotes, and reader aids where useful.

Use **DeepNote Article-Derived PDF** only when the user explicitly asks to keep the HTML/DeepNote visual style, asks for a webpage-style PDF, or rejects the official lecture-handout structure.

Use **DeepNote LaTeX PDF** only when the user explicitly asks to preserve DeepNote order with LaTeX typography but not official lecture-note restructuring.
