#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const SKILL_ROOT = path.resolve(__dirname, "..");
const STYLE_PATH = path.join(SKILL_ROOT, "assets", "v3-multimodal", "style.css");
const APP_PATH = path.join(SKILL_ROOT, "assets", "v3-multimodal", "app.js");
const V4_STYLE_PATH = path.join(SKILL_ROOT, "assets", "v4-learning-notes", "style.css");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  if (!args.model || !args.output) {
    throw new Error("Usage: render_v3_multimodal_html.cjs --model <v3_study_model.json> --output <title.html> [--report <renderer_report.json>]");
  }
  return args;
}

function loadMarked() {
  const candidates = [
    process.env.CODEX_MARKED_PATH,
    path.join(os.homedir(), ".codex", "tools", "mermaid-cli", "node_modules", "marked"),
    "marked",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const module = require(candidate);
      return module.marked || module;
    } catch (_) {
      // Try the next known runtime location.
    }
  }
  throw new Error("Unable to load marked. Install marked or set CODEX_MARKED_PATH.");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTime(value) {
  if (typeof value === "number") return value;
  const parts = String(value ?? "0").trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(value) || 0;
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  return h
    ? [h, m, s].map((part) => String(part).padStart(2, "0")).join(":")
    : [m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function parseSrtTimestamp(value) {
  const match = String(value).trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(`0.${match[4]}`);
}

function parseSrt(source) {
  return String(source)
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((block, index) => {
      const lines = block.split("\n").filter(Boolean);
      const timeIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeIndex < 0) return null;
      const [startRaw, endRaw] = lines[timeIndex].split("-->");
      const start = parseSrtTimestamp(startRaw);
      const end = parseSrtTimestamp(endRaw);
      const text = lines
        .slice(timeIndex + 1)
        .join(" ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return { index, start, end, time: formatTime(start), text };
    })
    .filter((item) => item && item.text);
}

function pathToUrl(modelRoot, outputRoot, value) {
  if (!value || /^(?:data:|https?:|file:)/.test(value)) return value || "";
  const absolute = path.resolve(modelRoot, value);
  return path.relative(outputRoot, absolute).split(path.sep).join("/") || path.basename(absolute);
}

function assertFile(modelRoot, value, label) {
  if (!value || /^(?:data:|https?:|file:)/.test(value)) return;
  const target = path.resolve(modelRoot, value);
  if (!fs.existsSync(target)) throw new Error(`${label} does not exist: ${target}`);
}

function validateModel(model, modelRoot) {
  if (model.schema_version !== "v3-multimodal-study-model@1") {
    throw new Error("schema_version must be v3-multimodal-study-model@1");
  }
  for (const key of ["bvid", "title", "duration_seconds", "canonical_url"]) {
    if (!model.metadata?.[key]) throw new Error(`metadata.${key} is required`);
  }
  if (!Array.isArray(model.chapters) || model.chapters.length < 3 || model.chapters.length > 12) {
    throw new Error("chapters must contain 3-12 editorially authored chapters");
  }
  const configuredMaxSourceClips = model.ui?.max_source_clips_per_chapter;
  if (configuredMaxSourceClips != null && (!Number.isInteger(configuredMaxSourceClips) || configuredMaxSourceClips < 0)) {
    throw new Error("ui.max_source_clips_per_chapter must be a non-negative integer");
  }
  const maxSourceClips = configuredMaxSourceClips ?? (model.ui?.learning_note_style ? 1 : null);
  const ids = new Set();
  let previousEnd = 0;
  model.chapters.forEach((chapter, index) => {
    for (const key of ["id", "label", "kicker", "title", "summary", "body_markdown"]) {
      if (!chapter[key]) throw new Error(`chapters[${index}].${key} is required`);
    }
    if (ids.has(chapter.id)) throw new Error(`Duplicate chapter id: ${chapter.id}`);
    ids.add(chapter.id);
    chapter.start = parseTime(chapter.start);
    chapter.end = parseTime(chapter.end);
    if (chapter.end <= chapter.start || chapter.start < previousEnd - 1) {
      throw new Error(`Invalid chapter interval at ${chapter.id}`);
    }
    previousEnd = chapter.end;
    if (!Array.isArray(chapter.cleaned_transcript) || chapter.cleaned_transcript.length === 0) {
      throw new Error(`${chapter.id} needs semantic cleaned_transcript blocks; do not auto-copy raw ASR`);
    }
    chapter.cleaned_transcript.forEach((block, blockIndex) => {
      block.start = parseTime(block.start);
      block.end = parseTime(block.end);
      if (!block.text || block.end <= block.start) {
        throw new Error(`Invalid cleaned transcript block ${chapter.id}[${blockIndex}]`);
      }
    });
    if (chapter.source_clips != null && !Array.isArray(chapter.source_clips)) {
      throw new Error(`${chapter.id}.source_clips must be an array when provided`);
    }
    if (maxSourceClips != null && (chapter.source_clips || []).length > maxSourceClips) {
      throw new Error(`${chapter.id}.source_clips exceeds the V4 editorial limit of ${maxSourceClips}; keep only the strongest claim-specific replay interval or explicitly raise ui.max_source_clips_per_chapter`);
    }
    const clipIds = new Set();
    (chapter.source_clips || []).forEach((clip, clipIndex) => {
      clip.start = parseTime(clip.start);
      clip.end = parseTime(clip.end);
      clip.after_paragraph = Number(clip.after_paragraph);
      if (!clip.id || !clip.label || clipIds.has(clip.id)) {
        throw new Error(`Invalid or duplicate source clip ${chapter.id}[${clipIndex}]`);
      }
      clipIds.add(clip.id);
      if (!Number.isInteger(clip.after_paragraph) || clip.after_paragraph < 1) {
        throw new Error(`${chapter.id}.${clip.id}.after_paragraph must be a positive integer`);
      }
      if (clip.end <= clip.start || clip.end - clip.start > 180) {
        throw new Error(`${chapter.id}.${clip.id} must be a focused clip between 1 and 180 seconds`);
      }
      if (clip.start < chapter.start - 1 || clip.end > chapter.end + 1) {
        throw new Error(`${chapter.id}.${clip.id} must stay inside the chapter interval`);
      }
    });
  });
  if (previousEnd > Number(model.metadata.duration_seconds) + 5) {
    throw new Error("Chapter intervals exceed metadata.duration_seconds");
  }
  for (const [label, value] of Object.entries({
    cover: model.source?.cover,
    video: model.source?.video,
    transcript: model.source?.transcript,
  })) assertFile(modelRoot, value, `source.${label}`);
  Object.entries(model.assets?.keyframes || {}).forEach(([id, item]) => assertFile(modelRoot, item.src, `keyframe ${id}`));
  Object.entries(model.assets?.diagrams || {}).forEach(([id, item]) => assertFile(modelRoot, item.src, `diagram ${id}`));
}

function assignTranscript(transcript, chapters) {
  return transcript.map((segment) => {
    let chapter = chapters.findIndex((item) => segment.start >= item.start && segment.start < item.end);
    if (chapter < 0) chapter = segment.start < chapters[0].start ? 0 : chapters.length - 1;
    return { ...segment, chapter };
  });
}

function validateCleanedTranscriptCoverage(transcript, chapters) {
  const uncovered = transcript.filter((segment) => {
    const chapter = chapters[segment.chapter];
    return !(chapter?.cleaned_transcript || []).some((block) =>
      segment.end > block.start && segment.start < block.end,
    );
  });
  if (uncovered.length) {
    const preview = uncovered
      .slice(0, 8)
      .map((segment) => `${formatTime(segment.start)} ${segment.text.slice(0, 24)}`)
      .join(" | ");
    throw new Error(
      `cleaned_transcript does not cover ${uncovered.length} raw speech segments. ` +
      `Add source-faithful semantic blocks before rendering. First gaps: ${preview}`,
    );
  }
  return { covered: transcript.length, total: transcript.length, ratio: 1 };
}

function makeMarkdownRenderer(model, modelRoot, outputRoot, marked) {
  let diagramCursor = 0;
  const diagramEntries = Object.entries(model.assets?.diagrams || {});
  const keyframeEntries = Object.entries(model.assets?.keyframes || {});
  const usedDiagramIds = new Set();
  const humanizeAssetLabels = Boolean(model.ui?.humanize_asset_labels);
  const renderKeyframe = (id, item, captionValue, timeValue) => {
    const caption = String(captionValue || item.caption || id).trim();
    const seconds = parseTime(timeValue ?? item.time);
    const src = pathToUrl(modelRoot, outputRoot, item.src);
    const label = humanizeAssetLabels ? "原片" : id;
    return `\n<figure class="inline-evidence keyframe" data-asset-id="${escapeHtml(id)}"><div class="media-frame" data-kind="keyframe"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" /><button class="play-on-frame" data-seek="${seconds}">▶ ${formatTime(seconds)}</button></div><figcaption><b>${escapeHtml(label)}</b><span>${escapeHtml(caption)} · 原视频 ${formatTime(seconds)}</span></figcaption></figure>\n`;
  };
  const renderDiagram = (rawId, rawCaption) => {
    const id = rawId.trim();
    const item = model.assets?.diagrams?.[id];
    if (!item) throw new Error(`Body references missing diagram ${id}`);
    usedDiagramIds.add(id);
    const caption = rawCaption.trim() || item.caption;
    const src = pathToUrl(modelRoot, outputRoot, item.src);
    const label = humanizeAssetLabels ? "结构图" : id;
    return `\n<figure class="inline-evidence diagram" data-asset-id="${escapeHtml(id)}"><div class="media-frame" data-kind="diagram"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" /></div><figcaption><b>${escapeHtml(label)}</b><span>${escapeHtml(caption)}</span></figcaption></figure>\n`;
  };
  return (markdown) => {
    let source = String(markdown || "").replace(/<!--([\s\S]*?)-->/g, "");
    source = source.replace(
      /【关键帧：([^，]+)，(.+?)，source_time=([^，]+)，intent=[^，]+，reason=([^】]+)】/g,
      (_, rawId, rawCaption, rawTime) => {
        const id = rawId.trim();
        const item = model.assets?.keyframes?.[id];
        if (!item) throw new Error(`Body references missing keyframe ${id}`);
        return renderKeyframe(id, item, rawCaption, rawTime);
      },
    );
    // Older audited DeepNotes use ordinary Markdown images for selected source
    // frames. Upgrade matching paths to the same bounded, seekable component.
    source = source.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, rawCaption, rawTarget) => {
      const target = rawTarget.trim().replace(/^<|>$/g, "").split(/\s+[\"']/)[0];
      const absolute = path.resolve(modelRoot, target);
      const found = keyframeEntries.find(([, item]) => path.resolve(modelRoot, item.src) === absolute);
      if (!found) return match;
      const [id, item] = found;
      return renderKeyframe(id, item, rawCaption, item.time);
    });
    // DeepNote keeps Mermaid source after its asset anchor for traceability.
    // Render the pair once so the next diagram cannot be inserted by mistake.
    source = source.replace(
      /【图表：([^\s，】]+)\s+([^，】]+)[^】]*】\s*```mermaid\s*[\s\S]*?```/g,
      (_, rawId, rawCaption) => renderDiagram(rawId, rawCaption),
    );
    source = source.replace(
      /【插图：([^，]+)，(.+?)，intent=structure，reason=([^】]+)】\s*```mermaid\s*[\s\S]*?```/g,
      (_, rawId, rawCaption) => renderDiagram(rawId, rawCaption),
    );
    source = source.replace(
      /【插图：([^，]+)，(.+?)，intent=structure，reason=([^】]+)】/g,
      (_, rawId, rawCaption) => renderDiagram(rawId, rawCaption),
    );
    source = source.replace(/```mermaid\s*[\s\S]*?```/g, () => {
      while (diagramCursor < diagramEntries.length && usedDiagramIds.has(diagramEntries[diagramCursor][0])) {
        diagramCursor += 1;
      }
      const [id, item] = diagramEntries[diagramCursor++] || [];
      if (!item) throw new Error("Mermaid block has no matching rendered diagram asset");
      usedDiagramIds.add(id);
      const src = pathToUrl(modelRoot, outputRoot, item.src);
      const label = humanizeAssetLabels ? "结构图" : id;
      return `\n<figure class="inline-evidence diagram" data-asset-id="${escapeHtml(id)}"><div class="media-frame" data-kind="diagram"><img src="${escapeHtml(src)}" alt="${escapeHtml(item.caption)}" /></div><figcaption><b>${escapeHtml(label)}</b><span>${escapeHtml(item.caption)}</span></figcaption></figure>\n`;
    });
    source = source.replace(/【(?:表格|截图建议|图表)：[^】]+】/g, "");
    const html = marked.parse(source, { gfm: true, breaks: false });
    return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, "</table></div>");
  };
}

function renderRawTranscript(items) {
  return items.map((segment) =>
    `<div class="transcript-line" data-segment="${segment.index}"><button data-seek="${segment.start}">${escapeHtml(segment.time)}</button><span>${escapeHtml(segment.text)}</span></div>`,
  ).join("");
}

function renderChapter(chapter, ui = {}) {
  const chapterTimeSeekable = ui.chapter_time_seekable ?? !ui.learning_note_style;
  const chapterTime = chapterTimeSeekable
    ? `<button class="time-jump" data-seek="${chapter.start}">▶ ${formatTime(chapter.start)}–${formatTime(chapter.end)} · 回到这一段</button>`
    : `<span class="chapter-time-label">章节 ${formatTime(chapter.start)}–${formatTime(chapter.end)}</span>`;
  return `
    <section class="chapter" id="chapter-${escapeHtml(chapter.id)}" data-chapter="${chapter.index}">
      <header class="chapter-head">
        <div class="chapter-index">${String(chapter.index + 1).padStart(2, "0")}</div>
        <div>
          <div class="chapter-kicker">${escapeHtml(chapter.kicker)}</div>
          <h2>${escapeHtml(chapter.title)}</h2>
          ${chapterTime}
        </div>
        <button class="chapter-bookmark" data-bookmark-chapter="${escapeHtml(chapter.id)}" aria-pressed="false"><span class="bookmark-star"></span><span>收藏本章</span></button>
      </header>
      <p class="chapter-summary">${escapeHtml(chapter.summary)}</p>
      <div class="prose">${chapter.body}</div>
      <button class="chapter-transcript-link" data-open-timeline="${chapter.index}">查看这一章的整理字幕 →</button>
    </section>`;
}

function renderTimelineRow(chapter) {
  const cleaned = chapter.cleaned_transcript.map((block, blockIndex) =>
    `<div class="cleaned-block" id="cleaned-${chapter.index}-${blockIndex}" data-cleaned-id="${chapter.index}-${blockIndex}" data-cleaned-search="${escapeHtml(block.text.toLowerCase())}"><button data-seek="${block.start}">${formatTime(block.start)}<br />${formatTime(block.end)}</button><p><span class="cleaned-text">${escapeHtml(block.text)}</span></p></div>`,
  ).join("");
  return `
    <article class="timeline-row" id="timeline-${escapeHtml(chapter.id)}" data-timeline-chapter="${chapter.index}" data-heading-search="${escapeHtml(`${chapter.label} ${chapter.summary}`.toLowerCase())}">
      <button class="timeline-time" data-seek="${chapter.start}">${formatTime(chapter.start)}<br />↓<br />${formatTime(chapter.end)}</button>
      <div class="timeline-copy">
        <div class="chapter-kicker">${String(chapter.index + 1).padStart(2, "0")} · ${escapeHtml(chapter.kicker)}</div>
        <div class="timeline-title-row"><h3>${escapeHtml(chapter.label)}</h3><button class="chapter-bookmark" data-bookmark-chapter="${escapeHtml(chapter.id)}" aria-pressed="false"><span class="bookmark-star"></span><span>收藏</span></button></div>
        <p>${escapeHtml(chapter.summary)}</p>
        <details class="timeline-transcript">
          <summary><span>展开语义整理字幕</span><small>${chapter.cleaned_transcript.length} 段 · 原始 ${chapter.transcript.length} 片段</small></summary>
          <div class="cleaned-transcript">
            <p class="transcript-method">以下不是逐字引语：按原始顺序保留论点、机制、例子与限制，去掉口头填充和重复。每段时间码均可回到本地视频核对。</p>
            ${cleaned}
            <details class="raw-fold"><summary>需要逐字核对？展开完整原始 ASR（${chapter.transcript.length} 片段）</summary><div class="chapter-transcript">${renderRawTranscript(chapter.transcript)}</div></details>
          </div>
        </details>
      </div>
    </article>`;
}

function renderBody(model, data, leadHtml, conclusionHtml, coverSrc, videoSrc) {
  const brandName = model.ui?.brand_name || "视频研究台";
  const brandBadge = model.ui?.brand_badge || model.ui?.product_version || "V3";
  const studyTabLabel = model.ui?.study_tab_label || "图文精读";
  const showThesisMap = model.ui?.show_thesis_map !== false;
  const toc = data.chapters.map((chapter) =>
    `<button class="toc-link" data-scroll="#chapter-${escapeHtml(chapter.id)}"><span>${String(chapter.index + 1).padStart(2, "0")}</span><span>${escapeHtml(chapter.label)}</span></button>`,
  ).join("");
  const thesis = showThesisMap ? data.chapters.map((chapter) =>
    `<button class="thesis-item" data-scroll="#chapter-${escapeHtml(chapter.id)}"><span class="num">${String(chapter.index + 1).padStart(2, "0")}</span><strong>${escapeHtml(chapter.label)}</strong><time>${formatTime(chapter.start)}–${formatTime(chapter.end)}</time></button>`,
  ).join("") : "";
  const timeline = data.chapters.map(renderTimelineRow).join("\n");
  const suggestions = (model.assets?.search_suggestions || []).map((item) =>
    `<button data-search-suggestion="${escapeHtml(item)}">${escapeHtml(item)}</button>`,
  ).join("");
  const cleanedCount = data.chapters.reduce((sum, chapter) => sum + chapter.cleaned_transcript.length, 0);
  const keyframeCount = Object.keys(model.assets?.keyframes || {}).length;
  const heroTitle = model.hero?.title_html || escapeHtml(model.metadata.title);
  const eyebrow = model.hero?.eyebrow || `MULTIMODAL STUDY · ${model.metadata.bvid}`;
  return `<body style="--cover: url('${escapeHtml(coverSrc)}')">
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="hero"><div class="hero-inner">
    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1>${heroTitle}</h1>
    <p class="hero-deck">${escapeHtml(model.hero?.deck || model.metadata.title)}</p>
    <div class="hero-footer"><div class="hero-metrics">
      <div class="metric"><strong>${formatTime(model.metadata.duration_seconds)}</strong><span>完整视频</span></div>
      <div class="metric"><strong>${data.transcript.length}</strong><span>字幕片段</span></div>
      <div class="metric"><strong>${keyframeCount}</strong><span>证据画面</span></div>
      <div class="metric"><strong>${data.chapters.length}</strong><span>知识章节</span></div>
    </div><button class="hero-action" data-seek="0">从原视频开始观看 ↗</button></div>
  </div></header>
  <nav class="mode-bar" aria-label="学习模式">
    <div class="brand"><strong>${escapeHtml(brandName)}</strong><span>${escapeHtml(brandBadge)}</span></div>
    <div class="mode-tabs" role="tablist"><button class="mode-tab" role="tab" aria-selected="true" data-view="study">${escapeHtml(studyTabLabel)}</button><button class="mode-tab" role="tab" aria-selected="false" data-view="timeline">章节与字幕</button></div>
    <div class="nav-utilities"><button class="utility-button" id="globalSearchToggle" aria-expanded="false"><span class="utility-icon">⌕</span><span class="utility-text">全文搜索</span></button><button class="utility-button" id="bookmarkToggle" aria-expanded="false"><span class="utility-icon">☆</span><span class="utility-text" id="bookmarkCount">书签 0</span></button><button class="utility-button" id="notesToggle" aria-expanded="false"><span class="utility-icon">✎</span><span class="utility-text" id="notesCount">笔记 0</span></button><button class="utility-button" id="readingResume" title="继续上次阅读"><span class="mini-progress"><i id="navReadingProgress"></i></span><span class="utility-text" id="readingProgressLabel">阅读 0%</span></button><button class="player-status" id="playerStatus" title="打开本地视频播放器">本地视频尚未播放</button></div>
  </nav>
  <main id="main">
    <section class="view active" id="view-study" aria-label="${escapeHtml(studyTabLabel)}"><div class="reading-shell">
      <aside class="toc" aria-label="文章目录"><div class="toc-label">Reading path</div>${toc}<div class="progress-line"><span id="readingProgress"></span></div><div class="progress-meta"><span id="readingProgressMeta">0%</span><span id="readChapterCount">0/${data.chapters.length} 已读</span></div><button class="continue-reading" id="continueReading">继续上次阅读 →</button></aside>
      <article><section class="lead-map${showThesisMap ? "" : " no-thesis-map"}"><h2>${escapeHtml(model.lead?.title || "先建立整体地图，再进入细节")}</h2><div class="lead-intro prose">${leadHtml}</div>${showThesisMap ? `<div class="thesis-map">${thesis}</div>` : ""}</section>${data.chapters.map((chapter) => renderChapter(chapter, model.ui || {})).join("\n")}<section class="conclusion"><h2>${escapeHtml(model.conclusion_title || "结论与迁移")}</h2><div class="prose">${conclusionHtml}</div></section></article>
    </div></section>
    <section class="view" id="view-timeline" aria-label="章节与整理字幕"><div class="view-shell"><header class="view-heading"><h2>章节、整理字幕与原始 ASR 在同一条时间线上</h2><p>${data.chapters.length} 章保留原始顺序。每章先给出语义整理字幕；需要逐字核对时，再展开完整 ASR，并可从任一时间码回到本地视频。</p></header><div class="search-panel"><label class="search-box"><span aria-hidden="true">⌕</span><input id="timelineSearch" type="search" placeholder="在章节与整理字幕中搜索……" autocomplete="off" /><span class="search-count" id="timelineSearchCount">${data.chapters.length} 章 · ${cleanedCount} 段</span></label><div class="search-navigation"><span id="timelineResultPosition">输入关键词后可逐条定位</span><button id="timelineSearchPrev" disabled aria-label="上一个搜索结果">↑</button><button id="timelineSearchNext" disabled aria-label="下一个搜索结果">↓</button></div></div><div class="timeline">${timeline}</div></div></section>
  </main>
  <div class="utility-backdrop" id="utilityBackdrop"></div><aside class="utility-drawer" id="utilityDrawer" aria-hidden="true" aria-label="学习工具"><header class="drawer-header"><strong id="drawerTitle">全文搜索</strong><button class="drawer-close" id="closeUtilityDrawer" aria-label="关闭学习工具">×</button></header><section class="drawer-panel" id="panel-search"><label class="global-search-box"><span aria-hidden="true">⌕</span><input id="globalSearch" type="search" placeholder="搜索正文、章节摘要与整理字幕" autocomplete="off" /></label><div class="global-search-meta"><span id="globalSearchCount">输入关键词开始搜索</span><div class="result-nav"><button id="globalSearchPrev" disabled aria-label="上一个结果">↑</button><button id="globalSearchNext" disabled aria-label="下一个结果">↓</button></div></div><div class="search-suggestions" id="searchSuggestions">${suggestions}</div><div class="global-results" id="globalResults"></div></section><section class="drawer-panel" id="panel-bookmarks"><p class="bookmark-intro">收藏章节用于回到论证位置；播放器中的“记住此刻”会保存精确时间码。所有记录只保存在当前浏览器本地。</p><div id="bookmarkContents"></div></section><section class="drawer-panel" id="panel-notes"><div class="notes-panel-head"><p>摘录正文、写下自己的理解，并保留对应原片时间。笔记只保存在当前浏览器。</p><button class="notes-export" id="exportNotes">导出 Markdown</button></div><div id="noteContents"></div></section></aside>
  <aside class="video-dock" id="videoDock" aria-label="本地视频播放器">
    <button class="dock-close" id="closeDock" type="button" title="关闭播放器" aria-label="关闭播放器">×</button>
    <div class="dock-grabber" aria-hidden="true"></div>
    <div class="dock-media"><video id="studyVideo" src="${escapeHtml(videoSrc)}" preload="metadata" poster="${escapeHtml(coverSrc)}" playsinline tabindex="0" aria-label="本地原视频"></video><button class="video-surface-play" id="videoSurfacePlay" type="button" aria-label="播放视频"><span>▶</span></button><button class="focus-exit" id="focusExit" type="button" aria-label="退出专注模式" hidden>退出专注</button></div>
    <section class="dock-subtitles" id="dockSubtitles" aria-label="同步字幕"><div class="subtitle-toolbar"><span id="subtitleKicker">整理字幕</span><div class="subtitle-controls" role="group" aria-label="字幕显示方式"><button class="subtitle-mode-option active" id="subtitleCleanedMode" data-subtitle-mode="cleaned" type="button" aria-pressed="true">整理字幕</button><button class="subtitle-mode-option" id="subtitleRawMode" data-subtitle-mode="raw" type="button" aria-pressed="false">逐字字幕</button><button class="subtitle-visibility" id="subtitleVisibilityToggle" type="button" aria-pressed="true">关闭字幕</button></div></div><p id="subtitleText" aria-live="polite">选择一个时间码后显示同步字幕</p><p id="subtitleNext"></p></section>
    <div class="dock-meta">
      <div class="dock-title"><strong id="dockTitle">${escapeHtml(model.metadata.title)}</strong><span id="dockTime">等待选择时间码</span></div>
      <div class="dock-scrubber"><time id="dockCurrentTime">00:00</time><input id="dockSeek" type="range" min="0" max="${model.metadata.duration_seconds}" step="0.05" value="0" aria-label="视频播放进度" /><time id="dockEndTime">${formatTime(model.metadata.duration_seconds)}</time></div>
      <div class="dock-actions"><button id="skipBack" title="后退 10 秒">↶ 10</button><button class="primary-play" id="togglePlayback" title="播放或暂停" aria-label="播放">▶</button><button id="skipForward" title="前进 10 秒">10 ↷</button><label class="rate-control" title="播放速度"><span>倍速</span><select id="playbackRate" aria-label="播放速度"><option value="0.75">0.75×</option><option value="1" selected>1.0×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2.0×</option></select></label><button id="returnToReading" class="return-to-reading" title="返回触发片段的正文" hidden>↩ 正文</button><button id="saveMoment" title="把当前视频时刻加入书签">＋时刻</button><div class="volume-control"><button id="muteToggle" type="button" title="静音">声音</button><input id="volumeControl" type="range" min="0" max="1" step="0.05" value="1" aria-label="音量" /></div><button id="focusModeToggle" type="button" title="隐藏字幕与控制菜单，专注观看视频" aria-pressed="false">专注</button><button id="compactDock" title="切换紧凑播放器">收起</button><button class="dock-split-action" id="splitDock" title="切换右侧并排播放器">并排</button><a id="bilibiliFallback" href="${escapeHtml(model.metadata.canonical_url)}" target="_blank" rel="noreferrer" title="在 Bilibili 打开">B站</a><button id="fullscreenDock" title="全屏播放器" aria-label="全屏播放器">⛶</button></div>
      <div class="dock-progress"><span id="dockProgress"></span></div>
    </div>
  </aside>`;
}

function build(args) {
  const modelPath = path.resolve(args.model);
  const outputPath = path.resolve(args.output);
  const modelRoot = path.dirname(modelPath);
  const outputRoot = path.dirname(outputPath);
  const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
  validateModel(model, modelRoot);
  fs.mkdirSync(outputRoot, { recursive: true });

  const marked = loadMarked();
  const renderMarkdown = makeMarkdownRenderer(model, modelRoot, outputRoot, marked);
  const transcript = assignTranscript(parseSrt(fs.readFileSync(path.resolve(modelRoot, model.source.transcript), "utf8")), model.chapters);
  const cleanedCoverage = validateCleanedTranscriptCoverage(transcript, model.chapters);
  const chapters = model.chapters.map((chapter, index) => {
    const { body_markdown: bodyMarkdown, source_clips: sourceClips = [], ...runtimeChapter } = chapter;
    return {
      ...runtimeChapter,
      index,
      body: renderMarkdown(bodyMarkdown),
      sourceClips: sourceClips.map((clip) => ({
        id: clip.id,
        label: clip.label,
        start: clip.start,
        end: clip.end,
        afterParagraph: clip.after_paragraph,
      })),
      cleanedTranscript: chapter.cleaned_transcript.map((block) => ({
        ...block,
        time: formatTime(block.start),
        endTime: formatTime(block.end),
      })),
      transcript: transcript.filter((segment) => segment.chapter === index),
    };
  });
  const coverSrc = pathToUrl(modelRoot, outputRoot, model.source.cover);
  const videoSrc = pathToUrl(modelRoot, outputRoot, model.source.video);
  const leadHtml = renderMarkdown(model.lead?.body_markdown || "");
  const conclusionHtml = renderMarkdown(model.conclusion_markdown || "");
  const data = {
    ui: model.ui || {},
    metadata: {
      ...model.metadata,
      transcript: { source: model.metadata.transcript_source || "timestamped transcript", segments: transcript.length },
    },
    chapters,
    transcript,
    assets: {
      ...(model.assets?.keyframes || {}),
      ...(model.assets?.diagrams || {}),
    },
    conclusion: conclusionHtml,
    coverDataUri: coverSrc,
    videoSrc,
    canonicalUrl: model.metadata.canonical_url,
  };
  const style = fs.readFileSync(STYLE_PATH, "utf8");
  const learningNotesStyle = model.ui?.learning_note_style
    ? fs.readFileSync(V4_STYLE_PATH, "utf8")
    : "";
  const app = fs.readFileSync(APP_PATH, "utf8");
  const body = renderBody(model, data, leadHtml, conclusionHtml, coverSrc, videoSrc);
  const payload = JSON.stringify(data).replaceAll("<", "\\u003c");
  const titleSuffix = model.ui?.title_suffix || "V3 多模态学习页";
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${escapeHtml(model.hero?.deck || model.metadata.title)}" /><link rel="icon" href="data:," /><title>${escapeHtml(model.metadata.title)} · ${escapeHtml(titleSuffix)}</title><style>${style}</style><style>.lead-intro{max-width:820px;margin:1.1rem 0 2rem;color:var(--muted)}.lead-intro p{margin:0 0 .8rem}.prose blockquote{margin:2rem 0;padding:1.25rem 1.5rem;border-left:4px solid var(--teal);background:var(--teal-soft);color:var(--ink)}.prose blockquote p{margin:0}.prose h4{margin:2.25rem 0 .8rem;font-family:var(--serif);font-size:1.35rem}.conclusion{margin-top:7rem;padding-top:3rem;border-top:1px solid var(--line)}.conclusion>h2{font-family:var(--serif);font-size:clamp(2.2rem,4vw,4.2rem);line-height:1.05}.inline-evidence img{object-fit:contain}@media(min-width:900px){.hero-title-nowrap{white-space:nowrap;font-size:.84em}}@media(max-width:760px){.lead-intro{font-size:.98rem}}</style>${learningNotesStyle ? `<style>${learningNotesStyle}</style>` : ""}</head>${body}<script id="studyPayload" type="application/json">${payload}</script><script>${app}</script></body></html>`;
  if (/【(?:关键帧|插图|图表|表格|截图建议)：/.test(html)) throw new Error("Unresolved asset anchor leaked into final HTML");
  fs.writeFileSync(outputPath, html);

  const reportPath = path.resolve(args.report || path.join(outputRoot, "v3_renderer_report.json"));
  const report = {
    schema_version: "v3-multimodal-renderer-report@1",
    generated_at: new Date().toISOString(),
    model: path.relative(outputRoot, modelPath),
    output: path.basename(outputPath),
    sha256: crypto.createHash("sha256").update(html).digest("hex"),
    bytes: Buffer.byteLength(html),
    chapters: chapters.length,
    cleaned_transcript_blocks: chapters.reduce((sum, chapter) => sum + chapter.cleaned_transcript.length, 0),
    cleaned_transcript_coverage: cleanedCoverage,
    raw_transcript_segments: transcript.length,
    source_clips: chapters.reduce((sum, chapter) => sum + chapter.sourceClips.length, 0),
    keyframes: Object.keys(model.assets?.keyframes || {}).length,
    diagrams: Object.keys(model.assets?.diagrams || {}).length,
    product_version: model.ui?.product_version || "V3",
    renderer: model.ui?.learning_note_style
      ? "V4 learning notes on approved V3 multimodal interaction shell"
      : "approved original V3 multimodal study product",
    thesis_map_visible: model.ui?.show_thesis_map !== false,
    compact_source_clips: Boolean(model.ui?.compact_source_clips),
    chapter_time_seekable: model.ui?.chapter_time_seekable ?? !model.ui?.learning_note_style,
    max_source_clips_per_chapter: model.ui?.max_source_clips_per_chapter ?? (model.ui?.learning_note_style ? 1 : null),
    player: {
      subtitle_modes: ["cleaned", "raw"],
      subtitle_visibility_toggle: true,
      duplicate_chapter_list: false,
      playback_rates: [0.75, 1, 1.25, 1.5, 2],
      skip_seconds: 10,
      focus_mode: true,
    },
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

try {
  build(parseArgs(process.argv.slice(2)));
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}
