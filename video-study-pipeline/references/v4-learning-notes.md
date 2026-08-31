# Learning Notes Content Profile

Use this reference for the default article HTML content profile. The `V4` filename and compatibility fields are internal implementation labels only. Never expose them as the product name. Reader-facing labels should use plain language such as `交互式图文笔记`.

## Product Definition

The V3 shell remains responsible for:

- source-cover hero and reading path;
- continuous article reading;
- merged chapter timeline, semantic cleaned transcript, and expandable raw ASR;
- focused source clips and timestamped local-video playback;
- search, bookmarks, reading progress, personal notes, and Markdown export;
- offline single-file delivery and responsive browser QA.

V4 changes the content treatment inside that shell. It should read like a strong learner's notes or an expert teaching Blog rather than a polished recap. The reader should be able to answer four questions quickly:

1. What problem is this section resolving?
2. What mechanism or relationship explains it?
3. What concrete case proves or demonstrates it?
4. Where does the conclusion stop being reliable, and how can it transfer?

## Learning Unit

Use this as a flexible semantic checklist, not a fixed visible template:

1. `认知问题`: the confusion, decision, or misconception being resolved;
2. `直觉解释`: a concrete mental model before formal terms;
3. `机制拆解`: causal chain, process, architecture, formula, or variable relationship;
4. `具体例子`: a worked case, source scene, data point, code path, or decision;
5. `反例 / 边界`: failure condition, unsafe generalization, objection, or uncertainty;
6. `迁移场景`: how the idea changes another decision or workflow;
7. `记忆钩子`: one content-specific sentence worth retaining.

Do not force all seven elements into every subsection. A simple point may need only the problem, mechanism, and example. Dense or consequential claims should normally include a worked example and a boundary when the source supports them. If the source does not support an element, keep the section concise or record an evidence gap instead of inventing content.

## Editorial Treatment

- Start with the real tension, not a front-loaded answer card.
- Explain intuition before terminology when the concept is abstract.
- Unfold mechanisms in prose, Mermaid, tables, formulas, or code rather than summarizing them as labels.
- Put examples immediately after the claim they clarify. Explain why the example changes the reader's judgment.
- Place limitations near the claim they constrain; do not hide all caveats at the end.
- Keep transfer guidance specific. Name the decision, variable, or workflow that changes.
- Use memory hooks sparingly. They must compress a real relationship, not repeat a generic slogan.
- Preserve natural variation: some chapters can be prose-led, some diagram-led, some table-led, and some evidence-frame-led.
- Separate orientation from playback. The chapter header time range is a non-interactive reading locator; precise replay belongs to evidence attached to a claim.
- Default to one primary source clip per chapter. Add a second only when it proves a materially different claim and no adjacent clickable keyframe already provides the same recall path.

## Hero Thesis

The hero deck is the shortest content summary on the page. Write one content-specific thesis, normally about 25-55 Chinese characters, that can replace watching the opening minutes and help the reader decide whether to continue.

- State the source's central judgment, causal relationship, or decisive tension.
- Prefer a sentence such as `AI 的下半场不再比谁更会生成答案，而比谁能进入真实世界、形成可验证且可恢复的行动闭环。`
- Do not describe the artifact or pipeline. Avoid phrases such as `精读笔记`, `本文将`, `用问题、机制、案例重构`, `每个判断都能回到原片`, or `帮助你快速了解视频`.
- Do not copy the source title with different punctuation. Add the most important new information the title does not already contain.
- Keep product affordances, source recall, and reading instructions in the interface or lead orientation, not in the hero deck.

Optional semantic HTML blocks supported by the renderer:

```html
<aside class="worked-example"><strong>例子</strong><span>...</span></aside>
<aside class="boundary-note"><strong>边界</strong><span>...</span></aside>
<aside class="memory-line"><strong>记住</strong><span>...</span></aside>
<div class="formula-card"><code>...</code><span>...</span></div>
```

These blocks must follow the relevant explanation and must add information. Do not stamp the same set of blocks into every chapter.

## Visual Placement

- Original source proof -> inspected keyframe labeled `原片`.
- Process, architecture, causal chain, argument map, or decision tree -> Mermaid-derived `结构图`.
- Multiple objects, variables, stages, risks, or options -> table or chart.
- Equation or metric -> `formula-card` plus variable definitions and validity conditions.
- Code or configuration -> readable code block followed by parameter/behavior explanation.

Do not create a separate evidence appendix, asset inventory, or decorative image chapter. Visual assets belong next to the exact paragraph they support. A keyframe must preserve modality-specific evidence or source context; a diagram must encode actual variables and relationships; a table must improve comparison.

## UI Configuration

New V4 plans should include this optional block:

```json
"ui": {
  "product_version": "V4",
  "brand_badge": "交互式图文笔记",
  "title_suffix": "交互式图文笔记",
  "study_tab_label": "精读笔记",
  "humanize_asset_labels": true,
  "learning_note_style": true,
  "show_thesis_map": false,
  "compact_source_clips": true,
  "chapter_time_seekable": false,
  "max_source_clips_per_chapter": 1
}
```

The sticky left reading path is the only chapter directory in the default V4 layout. Keep the short lead orientation, but do not repeat all chapter links in a second thesis map at the start of the article. Chapter headers show a non-clickable time range for orientation. Source-clip buttons show only the source label, time range, and duration; keep the editorial clip reason in the button tooltip and accessibility label. The merged timeline remains the exhaustive recall route, while the reading view exposes only the strongest claim-specific replay interval.

The assembler and renderer keep the model schema `v3-multimodal-study-model@1` for backward compatibility. New runs may name their editorial files `v4_editorial_plan.json` and `v4_study_model.json`; old V3 files remain valid. If the `ui` block is absent, the renderer must reproduce the original V3 labels and styling.

## Learning-Note QA

In addition to the V3 interaction QA:

- review whether important chapters teach a mechanism rather than merely state a thesis;
- verify worked examples and boundaries are source-backed and non-redundant;
- verify memory hooks are content-specific and sparse;
- verify tables, formulas, diagrams, and keyframes appear where they reduce learning cost;
- verify callout blocks do not repeat surrounding prose;
- verify reader-facing labels use `原片` and `结构图`, not internal asset ids;
- verify each chapter has no more than one default source clip, and that a nearby clickable keyframe does not duplicate the same interval and claim;
- visually inspect one prose-led chapter, one asset-dense chapter, the timeline, and mobile layout.

Checker metrics can detect structural regressions, but they do not prove teaching quality. Human semantic review is required before delivery.
