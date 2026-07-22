# Renderer Enrichment

Use this reference after `deep_note.md` and the shared asset pool exist, and before rendering PDF, article HTML, or presentation output.

Before using this reference, read `visual-asset-selection.md`. Renderer planning must preserve each asset's primary intent: `evidence`, `structure`, or `comparison`.

## Core Rule

`deep_note.md` is a content substrate, not a finished output. `asset_manifest.json` is an evidence and asset contract, not an appendix. Every selected renderer must add its own organization, visual rhythm, and asset treatment before final export.

Direct conversion is only acceptable when the user explicitly asks for a raw export. Otherwise, a final HTML/PDF/presentation that simply mirrors `deep_note.md` section by section without renderer-specific enrichment fails the pipeline.

## Shared Enrichment Pool

Build or refine these materials before renderer planning:

- Key terms and keywords: term, short explanation, why it matters, target section.
- Pull quotes or judgment sentences: short, high-signal claims that can anchor a layout.
- Keyframes: `intent=evidence`, source timestamp, visual description after inspection, target section, reason to include.
- Diagrams: `intent=structure`, Mermaid-first concept map, causal chain, timeline, matrix, decision tree, architecture sketch, or workflow.
- Tables/charts: `intent=comparison`, comparisons, typologies, checklists, metrics, named systems, examples, caveats.
- Reader aids: glossary, recap boxes, "how to use this" blocks, pitfalls, transfer checklist.
- Source anchors: timestamps, page anchors, original cover, slide/PDF/web assets, transcript evidence, extracted tables/formulas, ASR/OCR/extraction uncertainty notes when needed.

These assets should be placed where they support the argument. Do not front-load all assets, hide them only in an appendix, or use generated visuals as a substitute for useful original source figures, tables, formulas, or video frames. For this user, the strongest default visual families are Mermaid diagrams, inspected source/video frames, source figures, formulas, and precise tables/charts.

Use this default choice order when a paragraph could use more than one visual:

1. If the original source contains meaningful visual proof, use an inspected keyframe/source figure/image/table/formula as `evidence`.
2. If the reader needs relationships or sequence, use Mermaid as `structure`.
3. If the paragraph compares multiple objects or variables, use a table/chart as `comparison`.
If none of the three forms improves comprehension, keep the explanation textual rather than adding a decorative generated picture.

For a key subsection, choose one primary asset by default. Add a second only when it has a distinct intent, such as a keyframe for evidence plus Mermaid for structure.

## Required Renderer Briefs

Before rendering, create or update the relevant brief files in the workdir. The filenames can vary, but the content must be present and easy to audit.

| Renderer | Required brief | Purpose |
| --- | --- | --- |
| Article HTML | `article_render_brief.md` | Define article hook, reading path, visual theme, section rhythm, inline asset placement, responsive behavior. |
| PDF | `pdf_render_brief.md` | Define PDF family, page rhythm, figure/table placement, page-break strategy, print captions, glossary/callout treatment. |
| Presentation | `presentation/storyboard.md` plus `script.md` and `outline.md` | Define 16:9 scenes, narration steps, visual staging, progressive reveals, asset transformations, optional audio plan. |

Each brief must include:

- target reader and use case;
- selected renderer family or style route;
- section-by-section adaptation plan;
- asset usage map with asset ids, target locations, treatment, and skip reasons where applicable;
- asset intent map: evidence / structure / comparison, including why this asset type was chosen over the alternatives;
- key terms or keywords to surface;
- visual density and pacing rules;
- first-screen or first-section acceptance target when user review is expected.

## Article HTML Enrichment

Article HTML is a designed long-form reading experience, not a Markdown viewer.

Required treatment:

- Build a strong hero/lead that includes the original cover when available and useful.
- Use one opening main-route visual when it improves orientation. Use Mermaid for technical/logical topics, abstract mechanisms, and argument maps.
- Convert key terms into visible chips, glossary cards, side notes, or section openers.
- Use selected frames/diagrams/tables inline near the explanation they support.
- Prefer Mermaid for concept maps, decision flows, timelines, and argument maps when it communicates the structure more clearly than a hand-drawn generic SVG. Preserve the `.mmd` source and use SVG/PDF/PNG only as renderer-specific derivatives. Do not let low-quality PNG styling define the final look.
- Reject low-information architecture diagrams. If the graph only repeats section labels such as "背景问题", "核心概念", "论证链条", "可迁移框架", and "总结", do not insert it; rewrite it into a content-specific map of mechanisms, variables, examples, constraints, and conclusions.
- Put every visual asset inside a designed frame with an explicit maximum width and height. Do not let natural image dimensions decide the article layout.
- Add pull quotes, comparison cards, recap boxes, and callouts where they improve reading flow.
- Preserve tables and images from provided source PDFs/slides when useful.
- Use responsive layouts and image ratios that do not crop important content.
- Do not create a standalone "key evidence frames" chapter by default. Keyframes should be integrated into the body paragraph where they prove or contextualize the point.

Do not reuse the same generic generated image across unrelated videos. Generated images must be topic-specific and section-specific.

## PDF Enrichment

PDF is a printable study handout. It can share content with HTML, but it needs print-specific design.

Required treatment:

- Pick the PDF family from `pdf-output-families.md`.
- Plan page breaks, figure placement, table width, captions, and source-time notes before export.
- Render Mermaid/Graphviz/charts into stable visual assets before PDF export.
- Keep diagrams and key visual assets unbroken where possible; scale, rotate, or place on their own page when needed.
- Keep normal inline figures smaller than a full page. A single asset should only get a full page when it is intentionally designed as a full-page plate and remains readable at that size.
- Convert dense web layouts into print-readable blocks instead of dumping the HTML screen.
- Add print-oriented reader aids: glossary boxes, margin-style notes when supported, recap blocks, figure captions, and source anchors.
- Favor readable tables, rendered Mermaid, and evidence keyframes.

If the PDF is article-derived, the article brief can be reused, but `pdf_render_brief.md` must still record print adjustments and pagination checks.

## Presentation Enrichment

Presentation output is a staged 16:9 explanation, not a long article cut into slides.

Required treatment:

- Rewrite long paragraphs into narration steps and visual scenes.
- Convert keywords into on-screen cards, labels, or progressive reveals.
- Mermaid diagrams can be used directly as model cards in presentation. They do not need to be redrawn into another visual style when the Mermaid structure is already clear. They still must be bounded, simplified when necessary, captioned, and positioned intentionally; never paste a dense Mermaid graph full-slide without sizing and layout control.
- Convert tables into readable highlights, row-by-row reveals, matrix scenes, or simplified visual summaries.
- Use inspected video frames and Mermaid diagrams as bounded evidence/model cards with explicit frame size, caption, and safe margins. Do not paste raw images at natural size, do not let an image fill the slide by default, and do not use a full-slide image unless the whole slide is intentionally designed around it.
- Do not add generic concept art or decorative labeled illustrations to presentation scenes by default.
- Keep one scene focused on one cognitive move: problem, mechanism, example, contrast, or takeaway.
- If audio is requested, align narration segments with step counts and visual transitions.

## Anti-Patterns

- Passing `deep_note.md` straight into HTML/PDF/presentation and calling the result finished.
- Treating `asset_manifest.json` as a visible appendix instead of a renderer contract.
- Using one global visual theme, one generic image, or one identical asset plan for every video.
- Generating diagrams but not inserting them contextually.
- Rendering a table of contents as a diagram. A graph of generic labels such as "背景问题 -> 核心概念 -> 论证链条 -> 总结" is not a content architecture map.
- Extracting keyframes but only listing them in an audit file.
- Dropping an "asset explanation" or "assets used" box into the final reader-facing article instead of integrating assets into the relevant sections.
- Letting one or two images dominate an HTML/PDF page or presentation slide without a clear design reason, even when the image is a Mermaid diagram or an original video frame.
- Converting a dense table into an unreadable 16:9 slide or clipped PDF table.
- Replacing original useful keyframes with abstract SVGs without documenting why.
- Using a keyframe because the page looks monotonous, rather than because the frame is evidence.
- Replacing a multi-object comparison with a vague illustration instead of a table/chart.
- Using a generic AI-generated picture as visual filler instead of evidence, structure, comparison, or a clear text callout.
