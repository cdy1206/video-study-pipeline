# Visual Asset Selection

Use this reference before writing asset-aware `deep_note.md` sections and again before renderer-specific planning.

## Core Rule

Choose visuals by the job they do for the reader, not by variety or decoration.

Default priority:

```text
real evidence > structural understanding > comparison/data
keyframe      > Mermaid                  > table/chart
```

This priority is not a beauty ranking. It means original evidence should not be replaced by a generated illustration, and a clear Mermaid or table should not be redrawn into a vague decorative image.

## Intent Labels

Every planned body asset should have one primary intent.

| Intent | Use when | Preferred asset | Avoid |
| --- | --- | --- | --- |
| `evidence` | The source contains meaningful visual proof: video slide, whiteboard, code, chart, demo, scene context, PDF figure, webpage image, table, formula, or a source quote tied to an original visual. | Inspected keyframe, source slide/PDF figure, webpage image, table, or formula asset. | Talking-head frames or generic pictures used only to make the page less plain. |
| `structure` | The reader needs to see a process, architecture, causal chain, workflow, decision tree, timeline, or argument path. | Mermaid source rendered as a bounded diagram. | A table-of-contents graph made from generic section labels. |
| `comparison` | Multiple objects, options, stages, actors, metrics, costs, risks, pros/cons, or variables need to be compared. | Markdown table, styled table, or exact-data chart. | A vague generated picture that hides the comparison dimensions. |

## Placement Rules

- Put the asset next to the paragraph it supports. Do not create a reader-facing asset appendix.
- One key subsection should usually have one primary visual asset. Add a second only when it does a different job, such as a keyframe for evidence plus Mermaid for structure.
- Medium/long materials should normally use at least two distinct asset intents across the body when source material supports them.
- The opening can include one main-route visual. Use Mermaid for technical/logical topics, abstract mechanisms, and argument maps when a visual orientation genuinely helps.
- Keyframes are evidence, not filler. Use them when they preserve original proof, source scene, slide state, code/demo result, chart, whiteboard, or interview context.
- Tables/charts are mandatory candidates whenever the content compares multiple objects or variables.
- Mermaid is the default for systems, processes, causal chains, timelines, architectures, decision trees, and argument maps.
- Do not generate generic concept art or decorative labeled illustrations in the default workflow. Prefer a content-specific Mermaid model, a precise table/chart, or a text callout.

## Renderer Notes

- HTML can combine inline body assets with side notes, callouts, and bounded figure cards.
- PDF should favor readable tables, rendered Mermaid, and selected keyframes.
- Presentation should be stricter: one cognitive move per scene, bounded visual cards, no natural-size image paste. Mermaid and inspected keyframes are primary.

## Failure Patterns

- A keyframe reason says it is included to avoid monotony, add atmosphere, fill the page, or decorate the article.
- A Mermaid graph only connects labels like `背景问题 -> 核心概念 -> 论证链条 -> 总结`.
- A comparison is written as prose or vague illustration when a table/chart would clarify dimensions.
- A generic AI-generated picture appears where a keyframe, Mermaid diagram, table/chart, or text callout would be clearer.
- Assets appear only in a manifest, gallery, opening block, or appendix instead of next to the argument.
