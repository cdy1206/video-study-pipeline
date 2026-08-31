# PDF Output Families

Use this reference before rendering any PDF output.

The pipeline supports two PDF families. Pick the family from the user's wording and the selected output mode. Do not silently substitute one family for another.

Before rendering either family, read `renderer-enrichment.md` and create `pdf_render_brief.md` unless the user explicitly requested raw conversion. PDF is a print-specific study artifact, not a bare `deep_note.md` export.

## 1. Article-Derived PDF

Use when the user says:

- keep the HTML appearance;
- HTML + matching PDF;
- Blog PDF;
- webpage-style PDF;
- export the finished article as PDF.

Route:

`deep_note.md + assets -> article HTML -> browser print/export PDF`

This family is the best fit when the user wants the PDF to follow the interactive article's visual rhythm and reading order.

Requirements:

- build and validate the article HTML first;
- use `article_render_brief.md` for the article and `pdf_render_brief.md` for print-specific adjustments;
- include the same selected keyframes, figures, diagrams, and tables used by the HTML;
- pre-render Mermaid, Graphviz, charts, complex diagrams, and other code-defined visuals into stable SVG/PNG/PDF assets before PDF export;
- keep each diagram as one unbroken figure block where possible, scaling it to fit one page instead of splitting it across pages;
- render complex comparisons as readable HTML tables; if a table is too dense or wide, convert it to a reviewed visual-table asset;
- use print CSS or browser PDF settings to avoid cropped images, orphan headings, and awkward page breaks;
- export with Playwright/Chromium or an equivalent browser print engine, not a plain Markdown converter;
- record `article-derived` as the PDF family in the run manifest or delivery note.

Tradeoff:

- strongest visual consistency with HTML;
- page breaks require browser/PDF audit;
- complex print layouts can be less predictable than LaTeX.

## 2. DeepNote LaTeX PDF

Use when the user says:

- convert DeepNote directly to PDF;
- preserve DeepNote order with better print typography;
- printable learning notes;
- use LaTeX, but keep the Blog-style content structure.

Route:

`deep_note.md + asset_manifest.json + reviewed assets -> print-aware LaTeX -> PDF`

This family preserves the audited DeepNote argument and section order while adapting hierarchy, figures, tables, formulas, code, and pagination for print.

Requirements:

- preserve the `deep_note.md` top-level order and natural Blog-style argumentation;
- use `pdf_render_brief.md` to define print hierarchy, reader aids, asset placement, and pagination strategy;
- do not introduce a separate course-handout outline or mandatory repeated section endings;
- place selected assets near their DeepNote insertion targets;
- pre-render Mermaid, Graphviz, charts, and complex diagrams into PDF/PNG assets before LaTeX compilation; never print their source code;
- include diagrams with `\includegraphics` and `keepaspectratio`, scaling each diagram to remain readable on one page;
- render Markdown tables as real `longtable`/`tabular` structures with controlled column widths and smaller type when needed; use a reviewed visual-table asset when textual layout would be unreadable;
- preserve formulas as mathematics and code as readable code blocks rather than raster screenshots when practical;
- add captions and concrete source-time provenance to video-derived keyframes;
- record `deepnote-latex` as the PDF family in the run manifest or delivery note.

Tradeoff:

- strongest print typography and pagination control;
- less visually identical to HTML;
- requires explicit conversion and review of rich assets.

## Default For This User

The normal default output profile does not include PDF. Generate it only when the user asks for PDF or selects an output combination that includes PDF.

When PDF is requested without a family choice, use **DeepNote LaTeX PDF**. Its content source is `deep_note.md` plus `asset_manifest.json` and reviewed assets. Preserve depth, selected keyframes, rendered Mermaid diagrams, readable tables, formulas, code, cover, examples, and source-time provenance.

Use **Article-Derived PDF** when the user explicitly wants the PDF to match the final HTML's appearance or asks to print/export the webpage.
