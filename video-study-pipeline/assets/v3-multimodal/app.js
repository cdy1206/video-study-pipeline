(() => {
      const data = JSON.parse(document.getElementById("studyPayload").textContent);

      function ensureEnhancedUi() {
        const utilities = document.querySelector(".nav-utilities");
        if (utilities && !document.getElementById("notesToggle")) {
          const button = document.createElement("button");
          button.className = "utility-button";
          button.id = "notesToggle";
          button.setAttribute("aria-expanded", "false");
          button.innerHTML = '<span class="utility-icon">✎</span><span class="utility-text" id="notesCount">笔记 0</span>';
          utilities.insertBefore(button, document.getElementById("readingResume"));
        }
        const drawer = document.getElementById("utilityDrawer");
        if (drawer && !document.getElementById("panel-notes")) {
          const panel = document.createElement("section");
          panel.className = "drawer-panel";
          panel.id = "panel-notes";
          panel.innerHTML = '<div class="notes-panel-head"><p>摘录正文、写下自己的理解，并保留对应原片时间。笔记只保存在当前浏览器。</p><button class="notes-export" id="exportNotes">导出 Markdown</button></div><div id="noteContents"></div>';
          drawer.append(panel);
        }
        const actions = document.querySelector(".dock-actions");
        if (actions && !document.getElementById("returnToReading")) {
          const button = document.createElement("button");
          button.id = "returnToReading";
          button.className = "return-to-reading";
          button.title = "返回触发片段的正文";
          button.hidden = true;
          button.textContent = "↩ 正文";
          actions.insertBefore(button, document.getElementById("saveMoment"));
        }

        const dock = document.getElementById("videoDock");
        const video = document.getElementById("studyVideo");
        if (!dock || !video) return;

        let closeDock = document.getElementById("closeDock");
        if (!closeDock) {
          closeDock = document.createElement("button");
          closeDock.id = "closeDock";
          closeDock.textContent = "×";
        }
        closeDock.className = "dock-close";
        closeDock.type = "button";
        closeDock.title = "关闭播放器";
        closeDock.setAttribute("aria-label", "关闭播放器");
        if (closeDock.parentElement !== dock) dock.insertBefore(closeDock, dock.firstElementChild);

        video.removeAttribute("controls");
        video.setAttribute("playsinline", "");
        video.setAttribute("aria-label", "本地原视频");
        video.tabIndex = 0;

        let media = video.closest(".dock-media");
        if (!media) {
          media = document.createElement("div");
          media.className = "dock-media";
          video.parentElement.insertBefore(media, video);
          media.append(video);
        }
        if (!document.getElementById("videoSurfacePlay")) {
          const surfacePlay = document.createElement("button");
          surfacePlay.className = "video-surface-play";
          surfacePlay.id = "videoSurfacePlay";
          surfacePlay.type = "button";
          surfacePlay.setAttribute("aria-label", "播放视频");
          surfacePlay.innerHTML = "<span>▶</span>";
          media.append(surfacePlay);
        }
        if (!document.getElementById("focusExit")) {
          const focusExit = document.createElement("button");
          focusExit.className = "focus-exit";
          focusExit.id = "focusExit";
          focusExit.type = "button";
          focusExit.textContent = "退出专注";
          focusExit.setAttribute("aria-label", "退出专注模式");
          focusExit.hidden = true;
          media.append(focusExit);
        }

        let subtitles = document.getElementById("dockSubtitles");
        if (!subtitles) {
          subtitles = document.createElement("section");
          subtitles.className = "dock-subtitles";
          subtitles.id = "dockSubtitles";
          subtitles.setAttribute("aria-label", "同步字幕");
          subtitles.innerHTML = '<div class="subtitle-toolbar"><span id="subtitleKicker">整理字幕</span><div class="subtitle-controls" role="group" aria-label="字幕显示方式"><button class="subtitle-mode-option active" id="subtitleCleanedMode" data-subtitle-mode="cleaned" type="button" aria-pressed="true">整理字幕</button><button class="subtitle-mode-option" id="subtitleRawMode" data-subtitle-mode="raw" type="button" aria-pressed="false">逐字字幕</button><button class="subtitle-visibility" id="subtitleVisibilityToggle" type="button" aria-pressed="true">关闭字幕</button></div></div><p id="subtitleText" aria-live="polite">选择一个时间码后显示同步字幕</p><p id="subtitleNext"></p>';
          media.insertAdjacentElement("afterend", subtitles);
        }
        const subtitleToolbar = subtitles.querySelector(".subtitle-toolbar");
        if (subtitleToolbar && !document.getElementById("subtitleCleanedMode")) {
          subtitleToolbar.innerHTML = '<span id="subtitleKicker">整理字幕</span><div class="subtitle-controls" role="group" aria-label="字幕显示方式"><button class="subtitle-mode-option active" id="subtitleCleanedMode" data-subtitle-mode="cleaned" type="button" aria-pressed="true">整理字幕</button><button class="subtitle-mode-option" id="subtitleRawMode" data-subtitle-mode="raw" type="button" aria-pressed="false">逐字字幕</button><button class="subtitle-visibility" id="subtitleVisibilityToggle" type="button" aria-pressed="true">关闭字幕</button></div>';
        }

        const meta = dock.querySelector(".dock-meta");
        if (meta?.firstElementChild) meta.firstElementChild.classList.add("dock-title");
        if (meta && !document.getElementById("dockSeek")) {
          const scrubber = document.createElement("div");
          scrubber.className = "dock-scrubber";
          scrubber.innerHTML = '<time id="dockCurrentTime">00:00</time><input id="dockSeek" type="range" min="0" max="1" step="0.05" value="0" aria-label="视频播放进度" /><time id="dockEndTime">00:00</time>';
          const actionRow = meta.querySelector(".dock-actions");
          meta.insertBefore(scrubber, actionRow);
        }

        const actionRow = dock.querySelector(".dock-actions");
        const playback = document.getElementById("togglePlayback");
        if (actionRow && playback && !document.getElementById("skipBack")) {
          const back = document.createElement("button");
          back.id = "skipBack";
          back.type = "button";
          back.title = "后退 10 秒";
          back.textContent = "↶ 10";
          actionRow.insertBefore(back, playback);

          playback.classList.add("primary-play");
          playback.setAttribute("aria-label", "播放");

          const forward = document.createElement("button");
          forward.id = "skipForward";
          forward.type = "button";
          forward.title = "前进 10 秒";
          forward.textContent = "10 ↷";
          playback.insertAdjacentElement("afterend", forward);
        }

        if (actionRow && !document.getElementById("playbackRate")) {
          const rate = document.createElement("label");
          rate.className = "rate-control";
          rate.title = "播放速度";
          rate.innerHTML = '<span>倍速</span><select id="playbackRate" aria-label="播放速度"><option value="0.75">0.75×</option><option value="1">1.0×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2.0×</option></select>';
          const returnButton = document.getElementById("returnToReading");
          actionRow.insertBefore(rate, returnButton || document.getElementById("saveMoment"));
        }

        if (actionRow && !document.getElementById("volumeControl")) {
          const volume = document.createElement("div");
          volume.className = "volume-control";
          volume.innerHTML = '<button id="muteToggle" type="button" title="静音">声音</button><input id="volumeControl" type="range" min="0" max="1" step="0.05" value="1" aria-label="音量" />';
          actionRow.insertBefore(volume, document.getElementById("compactDock"));
        }

        if (actionRow && !document.getElementById("focusModeToggle")) {
          const focus = document.createElement("button");
          focus.id = "focusModeToggle";
          focus.type = "button";
          focus.title = "隐藏字幕与控制菜单，专注观看视频";
          focus.setAttribute("aria-pressed", "false");
          focus.textContent = "专注";
          actionRow.insertBefore(focus, document.getElementById("compactDock"));
        }

        if (actionRow && !document.getElementById("fullscreenDock")) {
          const fullscreen = document.createElement("button");
          fullscreen.id = "fullscreenDock";
          fullscreen.type = "button";
          fullscreen.title = "全屏播放器";
          fullscreen.setAttribute("aria-label", "全屏播放器");
          fullscreen.textContent = "⛶";
          actionRow.append(fullscreen);
        }
      }

      ensureEnhancedUi();
      const views = [...document.querySelectorAll(".view")];
      const tabs = [...document.querySelectorAll(".mode-tab")];
      const video = document.getElementById("studyVideo");
      const dock = document.getElementById("videoDock");
      const dockTime = document.getElementById("dockTime");
      const dockTitle = document.getElementById("dockTitle");
      const dockProgress = document.getElementById("dockProgress");
      const status = document.getElementById("playerStatus");
      const fallback = document.getElementById("bilibiliFallback");
      const timelineSearch = document.getElementById("timelineSearch");
      const timelineSearchCount = document.getElementById("timelineSearchCount");
      const timelineResultPosition = document.getElementById("timelineResultPosition");
      const timelineSearchPrev = document.getElementById("timelineSearchPrev");
      const timelineSearchNext = document.getElementById("timelineSearchNext");
      const timelineRows = [...document.querySelectorAll(".timeline-row")];
      const cleanedBlocks = [...document.querySelectorAll(".cleaned-block")];
      const cleanedOriginalText = new Map(cleanedBlocks.map((block) => [block, block.querySelector(".cleaned-text").textContent]));
      const utilityDrawer = document.getElementById("utilityDrawer");
      const utilityBackdrop = document.getElementById("utilityBackdrop");
      const drawerTitle = document.getElementById("drawerTitle");
      const globalSearch = document.getElementById("globalSearch");
      const globalSearchCount = document.getElementById("globalSearchCount");
      const globalResults = document.getElementById("globalResults");
      const bookmarkContents = document.getElementById("bookmarkContents");
      const noteContents = document.getElementById("noteContents");
      const notesToggle = document.getElementById("notesToggle");
      const notesCount = document.getElementById("notesCount");
      const returnToReading = document.getElementById("returnToReading");
      const videoSurfacePlay = document.getElementById("videoSurfacePlay");
      const focusModeToggle = document.getElementById("focusModeToggle");
      const focusExit = document.getElementById("focusExit");
      const dockSubtitles = document.getElementById("dockSubtitles");
      const subtitleKicker = document.getElementById("subtitleKicker");
      const subtitleText = document.getElementById("subtitleText");
      const subtitleNext = document.getElementById("subtitleNext");
      const subtitleCleanedMode = document.getElementById("subtitleCleanedMode");
      const subtitleRawMode = document.getElementById("subtitleRawMode");
      const subtitleVisibilityToggle = document.getElementById("subtitleVisibilityToggle");
      const playbackRate = document.getElementById("playbackRate");
      const dockSeek = document.getElementById("dockSeek");
      const dockCurrentTime = document.getElementById("dockCurrentTime");
      const dockEndTime = document.getElementById("dockEndTime");
      const volumeControl = document.getElementById("volumeControl");
      const muteToggle = document.getElementById("muteToggle");
      const storageKey = "video-study-v3:" + data.metadata.bvid;
      let searchTimer;
      let timelineMatches = [];
      let timelineMatchIndex = -1;
      let globalMatches = [];
      let globalMatchIndex = -1;
      let lastVideoPersist = 0;
      let progressTimer;
      let progressTrackingEnabled = false;
      let activeClip = null;
      let activeNoteEditor = null;
      let lastTextSelection = null;
      let lastSubtitleKey = null;
      let isSeeking = false;
      let focusUiTimer = null;

      function loadState() {
        try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
        catch (_) { return {}; }
      }

      const stored = loadState();
      const appState = {
        version: 7,
        reading: Object.assign({ progress: 0, scrollY: 0, chapterId: null, view: "study", readChapters: [] }, stored.reading || {}),
        bookmarks: Object.assign({ chapters: [], moments: [] }, stored.bookmarks || {}),
        player: Object.assign({ open: false, mode: "floating", previousMode: "floating", time: 0, rate: 1, volume: 1, muted: false, subtitleMode: "cleaned", lastSubtitleMode: "cleaned", focusMode: false }, stored.player || {}),
        notes: Array.isArray(stored.notes) ? stored.notes : [],
      };
      if (!Array.isArray(appState.reading.readChapters)) appState.reading.readChapters = [];
      if (!Array.isArray(appState.bookmarks.chapters)) appState.bookmarks.chapters = [];
      if (!Array.isArray(appState.bookmarks.moments)) appState.bookmarks.moments = [];
      if (![0.75, 1, 1.25, 1.5, 2].includes(Number(appState.player.rate))) appState.player.rate = 1;
      if (!Number.isFinite(Number(appState.player.volume))) appState.player.volume = 1;
      appState.player.volume = Math.min(1, Math.max(0, Number(appState.player.volume)));
      if (!["raw", "cleaned", "off"].includes(appState.player.subtitleMode)) appState.player.subtitleMode = "cleaned";
      if (!["raw", "cleaned"].includes(appState.player.lastSubtitleMode)) {
        appState.player.lastSubtitleMode = appState.player.subtitleMode === "raw" ? "raw" : "cleaned";
      }

      function persistState() {
        try { localStorage.setItem(storageKey, JSON.stringify(appState)); }
        catch (_) {}
      }

      function formatTime(seconds) {
        const value = Math.max(0, Math.floor(seconds || 0));
        const h = Math.floor(value / 3600);
        const m = Math.floor((value % 3600) / 60);
        const s = value % 60;
        return h ? [h, m, s].map((n) => String(n).padStart(2, "0")).join(":") : [m, s].map((n) => String(n).padStart(2, "0")).join(":");
      }

      function chapterForTime(seconds) {
        return data.chapters.find((chapter) => seconds >= chapter.start && seconds < chapter.end) || data.chapters.at(-1);
      }

      const cleanedSubtitleItems = data.chapters
        .flatMap((chapter) => (chapter.cleanedTranscript || []).map((item, index) => ({ ...item, chapterId: chapter.id, chapterLabel: chapter.label, index })))
        .sort((a, b) => a.start - b.start);

      function timedEntry(items, seconds) {
        let low = 0;
        let high = items.length - 1;
        while (low <= high) {
          const mid = (low + high) >> 1;
          const item = items[mid];
          if (seconds < item.start) high = mid - 1;
          else if (seconds >= item.end) low = mid + 1;
          else return { item, index: mid };
        }
        return null;
      }

      function updateSubtitles(seconds, force = false) {
        const mode = appState.player.subtitleMode;
        dockSubtitles.classList.toggle("subtitles-off", mode === "off");
        subtitleCleanedMode.classList.toggle("active", mode === "cleaned");
        subtitleRawMode.classList.toggle("active", mode === "raw");
        subtitleCleanedMode.setAttribute("aria-pressed", String(mode === "cleaned"));
        subtitleRawMode.setAttribute("aria-pressed", String(mode === "raw"));
        subtitleVisibilityToggle.setAttribute("aria-pressed", String(mode !== "off"));
        subtitleVisibilityToggle.textContent = mode === "off" ? "开启字幕" : "关闭字幕";

        if (mode === "off") {
          if (!force && lastSubtitleKey === "off") return;
          lastSubtitleKey = "off";
          subtitleKicker.textContent = "字幕关闭";
          subtitleText.textContent = "";
          subtitleNext.textContent = "";
          return;
        }

        const source = mode === "cleaned" ? cleanedSubtitleItems : data.transcript;
        const match = timedEntry(source, seconds);
        const key = mode + ":" + (match ? match.index : "none");
        if (!force && key === lastSubtitleKey) return;
        lastSubtitleKey = key;

        if (mode === "cleaned") {
          subtitleKicker.textContent = "整理字幕";
          subtitleText.textContent = match?.item.text || "整理字幕覆盖校验失败，请重新生成本页。";
          subtitleNext.textContent = match
            ? match.item.chapterLabel + " · " + formatTime(match.item.start) + "–" + formatTime(match.item.end)
            : "";
          return;
        }

        subtitleKicker.textContent = "原始逐字稿";
        subtitleText.textContent = match?.item.text || "正在定位同步字幕……";
        const next = match ? source[match.index + 1] : null;
        subtitleNext.textContent = next ? "下一句 · " + next.text : "";
      }

      function updatePlayerRange(seconds) {
        const duration = Number.isFinite(video.duration) ? video.duration : Number(data.metadata.duration_seconds) || 0;
        const start = activeClip ? activeClip.start : 0;
        const end = activeClip ? activeClip.end : duration;
        if (!isSeeking) {
          dockSeek.min = String(start);
          dockSeek.max = String(Math.max(start + .1, end));
          dockSeek.value = String(Math.min(end, Math.max(start, seconds || 0)));
        }
        dockCurrentTime.textContent = formatTime(seconds || 0);
        dockEndTime.textContent = formatTime(end);
        const progress = (seconds - start) / Math.max(.1, end - start);
        dockProgress.style.width = Math.min(100, Math.max(0, progress * 100)) + "%";
      }

      function setPlaybackUi(paused) {
        const playButton = document.getElementById("togglePlayback");
        playButton.textContent = paused ? "▶" : "❚❚";
        playButton.setAttribute("aria-label", paused ? "播放" : "暂停");
        videoSurfacePlay.setAttribute("aria-label", paused ? "播放视频" : "暂停视频");
        dock.classList.toggle("is-paused", paused);
        if (appState.player.focusMode) revealFocusUi();
      }

      function revealFocusUi() {
        if (!appState.player.focusMode) return;
        dock.classList.add("focus-ui-visible");
        clearTimeout(focusUiTimer);
        if (!video.paused) {
          focusUiTimer = setTimeout(() => dock.classList.remove("focus-ui-visible"), 2200);
        }
      }

      function setFocusMode(active) {
        appState.player.focusMode = Boolean(active);
        if (appState.player.focusMode && appState.player.mode === "compact") {
          applyDockMode(appState.player.previousMode === "split" ? "split" : "floating");
        }
        dock.classList.toggle("mode-focus", appState.player.focusMode);
        focusModeToggle.textContent = appState.player.focusMode ? "退出专注" : "专注";
        focusModeToggle.setAttribute("aria-pressed", String(appState.player.focusMode));
        if (!appState.player.focusMode && document.activeElement === focusExit) focusModeToggle.focus();
        focusExit.hidden = !appState.player.focusMode;
        if (appState.player.focusMode) revealFocusUi();
        else {
          clearTimeout(focusUiTimer);
          dock.classList.remove("focus-ui-visible");
        }
        persistState();
      }

      function toggleVideoPlayback() {
        if (activeClip?.finished) {
          activeClip.finished = false;
          activeClip.button?.classList.remove("completed");
          activeClip.button?.classList.add("playing");
          seekVideo(activeClip.start, { keepClip: true });
          return;
        }
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      }

      function skipVideo(seconds) {
        const duration = Number.isFinite(video.duration) ? video.duration : Number(data.metadata.duration_seconds) || 0;
        const lower = activeClip ? activeClip.start : 0;
        const upper = activeClip ? activeClip.end : duration;
        const target = Math.min(upper, Math.max(lower, (video.currentTime || lower) + seconds));
        if (activeClip && target < activeClip.end - .08) {
          activeClip.finished = false;
          activeClip.button?.classList.remove("completed");
          activeClip.button?.classList.add("playing");
        }
        video.currentTime = target;
        updatePlayerRange(target);
        updateSubtitles(target, true);
      }

      function escapeText(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function setHighlightedText(element, value, query) {
        const source = String(value);
        const needle = String(query || "");
        element.replaceChildren();
        if (!needle) {
          element.textContent = source;
          return;
        }
        const lowerSource = source.toLowerCase();
        const lowerNeedle = needle.toLowerCase();
        let cursor = 0;
        let index = lowerSource.indexOf(lowerNeedle, cursor);
        while (index >= 0) {
          if (index > cursor) element.append(document.createTextNode(source.slice(cursor, index)));
          const mark = document.createElement("mark");
          mark.textContent = source.slice(index, index + needle.length);
          element.append(mark);
          cursor = index + needle.length;
          index = lowerSource.indexOf(lowerNeedle, cursor);
        }
        if (cursor < source.length) element.append(document.createTextNode(source.slice(cursor)));
      }

      function textFromHtml(value) {
        const template = document.createElement("template");
        template.innerHTML = value;
        return (template.content.textContent || "").replace(/\s+/g, " ").trim();
      }

      function contextSnippet(value, query) {
        const text = String(value).replace(/\s+/g, " ").trim();
        const lower = text.toLowerCase();
        const index = lower.indexOf(query.toLowerCase());
        const start = Math.max(0, (index < 0 ? 0 : index) - 54);
        const end = Math.min(text.length, start + 150);
        return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
      }

      const searchEntries = [];
      data.chapters.forEach((chapter) => {
        const articleText = chapter.summary + " " + textFromHtml(chapter.body);
        searchEntries.push({
          type: "article",
          kind: "正文",
          chapterId: chapter.id,
          chapterIndex: chapter.index,
          title: chapter.label,
          meta: "第 " + (chapter.index + 1) + " 章 · " + formatTime(chapter.start),
          text: articleText,
        });
        chapter.cleanedTranscript.forEach((block, blockIndex) => {
          searchEntries.push({
            type: "transcript",
            kind: "整理字幕",
            chapterId: chapter.id,
            chapterIndex: chapter.index,
            blockId: chapter.index + "-" + blockIndex,
            title: chapter.label,
            meta: block.time + "–" + block.endTime,
            text: block.text,
          });
        });
      });

      function applyDockMode(mode) {
        const safeMode = ["floating", "compact", "split"].includes(mode) ? mode : "floating";
        dock.classList.remove("mode-floating", "mode-compact", "mode-split");
        dock.classList.add("mode-" + safeMode);
        appState.player.mode = safeMode;
        document.body.classList.toggle("player-split", appState.player.open && safeMode === "split" && window.innerWidth > 1120);
        document.getElementById("compactDock").textContent = safeMode === "compact" ? "展开" : "收起";
        document.getElementById("splitDock").textContent = safeMode === "split" ? "浮窗" : "并排";
        persistState();
      }

      function setDockOpen(open, pauseOnClose = false) {
        appState.player.open = Boolean(open);
        dock.classList.toggle("open", appState.player.open);
        document.body.classList.toggle("player-open", appState.player.open);
        document.body.classList.toggle("player-split", appState.player.open && appState.player.mode === "split" && window.innerWidth > 1120);
        if (!appState.player.open && pauseOnClose) video.pause();
        persistState();
      }

      function restoreVideoTime() {
        const target = Number(appState.player.time) || 0;
        if (target > 0 && Number.isFinite(target)) {
          try { video.currentTime = Math.min(target, Math.max(0, (video.duration || data.metadata.duration_seconds) - 1)); } catch (_) {}
        }
      }

      function clearActiveClip() {
        document.querySelectorAll(".source-clip-play.playing, .source-clip-play.completed").forEach((button) => button.classList.remove("playing", "completed"));
        activeClip = null;
        returnToReading.hidden = true;
      }

      function seekVideo(seconds, options = {}) {
        const target = Number(seconds) || 0;
        if (!options.keepClip) clearActiveClip();
        const applySeek = () => {
          try { video.currentTime = target; } catch (_) {}
          video.play().catch(() => {});
        };
        if (video.readyState >= 1) applySeek();
        else video.addEventListener("loadedmetadata", applySeek, { once: true });
        const chapter = chapterForTime(target);
        appState.player.time = target;
        setDockOpen(true);
        dockTitle.textContent = chapter ? chapter.label : data.metadata.title;
        dockTime.textContent = formatTime(target) + " · " + (chapter?.kicker || "原视频");
        fallback.href = data.canonicalUrl + "?t=" + Math.floor(target);
        status.textContent = "▶ " + formatTime(target) + " · " + (chapter?.label || "原视频");
      }

      function playSourceClip(button) {
        const start = Number(button.dataset.clipStart) || 0;
        const end = Number(button.dataset.clipEnd) || 0;
        if (end <= start) return;
        clearActiveClip();
        const paragraph = button.closest(".source-clip-strip")?.previousElementSibling;
        activeClip = {
          start,
          end,
          label: button.dataset.clipLabel || "原片片段",
          button,
          returnTargetId: paragraph?.id || null,
          returnScrollY: window.scrollY,
        };
        button.classList.add("playing");
        returnToReading.hidden = false;
        seekVideo(start, { keepClip: true });
        dockTitle.textContent = activeClip.label;
        dockTime.textContent = formatTime(start) + "–" + formatTime(end) + " · 短片段播放";
      }

      function returnToClipOrigin(closePlayer = false) {
        const targetId = activeClip?.returnTargetId;
        const savedScrollY = activeClip?.returnScrollY;
        if (closePlayer) setDockOpen(false, true);
        clearActiveClip();
        activateView("study", false);
        requestAnimationFrame(() => {
          const target = targetId ? document.getElementById(targetId) : null;
          if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
          else if (Number.isFinite(savedScrollY)) window.scrollTo({ top: savedScrollY, behavior: "smooth" });
        });
      }

      function openPlayerWithoutPlaying() {
        setDockOpen(true);
        if (video.readyState >= 1) restoreVideoTime();
        else video.addEventListener("loadedmetadata", restoreVideoTime, { once: true });
      }

      function activateView(name, resetScroll = true) {
        tabs.forEach((item) => item.setAttribute("aria-selected", String(item.dataset.view === name)));
        views.forEach((view) => view.classList.toggle("active", view.id === "view-" + name));
        appState.reading.view = name;
        persistState();
        if (resetScroll) window.scrollTo({ top: document.querySelector(".mode-bar").offsetTop, behavior: "smooth" });
      }

      function openDrawer(name) {
        const title = name === "bookmarks" ? "我的书签" : (name === "notes" ? "我的笔记" : "全文搜索");
        drawerTitle.textContent = title;
        utilityDrawer.classList.add("open");
        utilityBackdrop.classList.add("open");
        utilityDrawer.setAttribute("aria-hidden", "false");
        document.querySelectorAll(".drawer-panel").forEach((panel) => panel.classList.toggle("active", panel.id === "panel-" + name));
        document.getElementById("globalSearchToggle").setAttribute("aria-expanded", String(name === "search"));
        document.getElementById("bookmarkToggle").setAttribute("aria-expanded", String(name === "bookmarks"));
        notesToggle.setAttribute("aria-expanded", String(name === "notes"));
        if (name === "bookmarks") renderBookmarks();
        if (name === "notes") renderNotes();
        if (name === "search") setTimeout(() => globalSearch.focus(), 180);
      }

      function closeDrawer() {
        utilityDrawer.classList.remove("open");
        utilityBackdrop.classList.remove("open");
        utilityDrawer.setAttribute("aria-hidden", "true");
        document.getElementById("globalSearchToggle").setAttribute("aria-expanded", "false");
        document.getElementById("bookmarkToggle").setAttribute("aria-expanded", "false");
        notesToggle.setAttribute("aria-expanded", "false");
      }

      function renderGlobalSearch() {
        const query = globalSearch.value.trim();
        document.getElementById("searchSuggestions").hidden = Boolean(query);
        globalResults.innerHTML = "";
        globalMatchIndex = -1;
        if (!query) {
          globalMatches = [];
          globalSearchCount.textContent = "输入关键词开始搜索";
          document.getElementById("globalSearchPrev").disabled = true;
          document.getElementById("globalSearchNext").disabled = true;
          return;
        }
        const lower = query.toLowerCase();
        globalMatches = searchEntries.filter((entry) => (entry.title + " " + entry.text).toLowerCase().includes(lower));
        globalSearchCount.textContent = globalMatches.length ? "找到 " + globalMatches.length + " 条结果" : "没有找到匹配内容";
        document.getElementById("globalSearchPrev").disabled = globalMatches.length < 2;
        document.getElementById("globalSearchNext").disabled = globalMatches.length < 2;
        globalResults.innerHTML = globalMatches.slice(0, 50).map((entry, index) => '<button class="global-result" data-global-result="' + index + '"><span class="global-result-top"><span>' + escapeText(entry.kind) + '</span><span>' + escapeText(entry.meta) + '</span></span><strong></strong><p></p></button>').join("");
        [...globalResults.querySelectorAll(".global-result")].forEach((result, index) => {
          const entry = globalMatches[index];
          setHighlightedText(result.querySelector("strong"), entry.title, query);
          setHighlightedText(result.querySelector("p"), contextSnippet(entry.text, query), query);
        });
      }

      function selectGlobalMatch(step) {
        if (!globalMatches.length) return;
        globalMatchIndex = (globalMatchIndex + step + globalMatches.length) % globalMatches.length;
        const nodes = [...globalResults.querySelectorAll(".global-result")];
        nodes.forEach((node, index) => node.classList.toggle("current", index === globalMatchIndex));
        nodes[globalMatchIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        globalSearchCount.textContent = "第 " + (globalMatchIndex + 1) + " / " + globalMatches.length + " 条";
      }

      function openSearchResult(entry) {
        if (!entry) return;
        closeDrawer();
        document.querySelectorAll(".search-focus, .search-current").forEach((node) => node.classList.remove("search-focus", "search-current"));
        if (entry.type === "article") {
          activateView("study", false);
          const target = document.getElementById("chapter-" + entry.chapterId);
          target?.classList.add("search-focus");
          setTimeout(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        } else {
          activateView("timeline", false);
          const row = document.querySelector("[data-timeline-chapter='" + entry.chapterIndex + "']");
          const details = row?.querySelector(".timeline-transcript");
          if (details) details.open = true;
          const target = document.getElementById("cleaned-" + entry.blockId);
          target?.classList.add("search-current");
          setTimeout(() => target?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }
      }

      function renderBookmarkButtons() {
        const selected = new Set(appState.bookmarks.chapters);
        document.querySelectorAll("[data-bookmark-chapter]").forEach((button) => {
          const active = selected.has(button.dataset.bookmarkChapter);
          button.setAttribute("aria-pressed", String(active));
          const label = button.querySelector("span:last-child");
          if (label) label.textContent = active ? "已收藏" : (button.closest(".timeline-row") ? "收藏" : "收藏本章");
        });
        const count = appState.bookmarks.chapters.length + appState.bookmarks.moments.length;
        document.getElementById("bookmarkCount").textContent = "书签 " + count;
      }

      function toggleChapterBookmark(chapterId) {
        const index = appState.bookmarks.chapters.indexOf(chapterId);
        if (index >= 0) appState.bookmarks.chapters.splice(index, 1);
        else appState.bookmarks.chapters.push(chapterId);
        persistState();
        renderBookmarkButtons();
        if (utilityDrawer.classList.contains("open")) renderBookmarks();
      }

      function saveCurrentMoment() {
        const time = Math.max(0, Math.round(video.currentTime || appState.player.time || 0));
        const id = "moment-" + time;
        const existing = appState.bookmarks.moments.find((item) => item.id === id);
        if (!existing) {
          const chapter = chapterForTime(time);
          appState.bookmarks.moments.unshift({ id, time, label: chapter?.label || "原视频", createdAt: Date.now() });
          appState.bookmarks.moments = appState.bookmarks.moments.slice(0, 30);
          persistState();
          renderBookmarkButtons();
        }
        const button = document.getElementById("saveMoment");
        button.textContent = existing ? "已保存" : "已记住";
        setTimeout(() => { button.textContent = "＋时刻"; }, 1200);
      }

      function renderBookmarks() {
        const chapterItems = appState.bookmarks.chapters.map((id) => data.chapters.find((chapter) => chapter.id === id)).filter(Boolean);
        const momentItems = appState.bookmarks.moments;
        if (!chapterItems.length && !momentItems.length) {
          bookmarkContents.innerHTML = '<div class="bookmark-empty">还没有书签。可在正文收藏章节，或在播放器中记住某个时刻。</div>';
          return;
        }
        const chapterHtml = chapterItems.length ? '<section class="bookmark-group"><h3>章节</h3><div class="bookmark-list">' + chapterItems.map((chapter) => '<div class="bookmark-item"><button class="bookmark-main" data-bookmark-go="' + chapter.id + '"><strong>' + escapeText(chapter.label) + '</strong><span>第 ' + (chapter.index + 1) + ' 章 · ' + formatTime(chapter.start) + '</span></button><button class="bookmark-remove" data-bookmark-remove="' + chapter.id + '" aria-label="移除章节书签">×</button></div>').join("") + '</div></section>' : "";
        const momentHtml = momentItems.length ? '<section class="bookmark-group"><h3>视频时刻</h3><div class="bookmark-list">' + momentItems.map((item) => '<div class="bookmark-item"><button class="bookmark-main" data-moment-go="' + item.time + '"><strong>' + escapeText(item.label) + '</strong><span>' + formatTime(item.time) + ' · 点击播放</span></button><button class="bookmark-remove" data-moment-remove="' + item.id + '" aria-label="移除视频时刻">×</button></div>').join("") + '</div></section>' : "";
        bookmarkContents.innerHTML = chapterHtml + momentHtml;
      }

      function notesForParagraph(paragraphId) {
        return appState.notes.filter((note) => note.paragraphId === paragraphId);
      }

      function updateNoteUi() {
        notesCount.textContent = "笔记 " + appState.notes.length;
        document.querySelectorAll("[data-note-trigger]").forEach((button) => {
          const count = notesForParagraph(button.dataset.noteTrigger).length;
          button.textContent = count ? "已记 " + count : "＋ 笔记";
          button.closest(".source-clip-strip")?.classList.toggle("has-note", count > 0);
          document.getElementById(button.dataset.noteTrigger)?.classList.toggle("has-note", count > 0);
        });
      }

      function makeSourceClipButton(clip) {
        const button = document.createElement("button");
        button.className = "source-clip-play";
        button.dataset.clipId = clip.id;
        button.dataset.clipStart = clip.start;
        button.dataset.clipEnd = clip.end;
        button.dataset.clipLabel = clip.label;
        const duration = Math.max(1, Math.round(clip.end - clip.start));
        const compactLabel = "▶ 原片 " + formatTime(clip.start) + "–" + formatTime(clip.end) + " · " + duration + " 秒";
        const fullLabel = compactLabel + " · " + clip.label;
        button.textContent = data.ui?.compact_source_clips ? compactLabel : fullLabel;
        button.title = "播放原片证据：" + clip.label;
        button.setAttribute("aria-label", fullLabel);
        return button;
      }

      function setupParagraphTools() {
        data.chapters.forEach((chapter) => {
          const section = document.getElementById("chapter-" + chapter.id);
          if (!section) return;
          const paragraphs = [...section.querySelectorAll(".prose > p")];
          const clips = Array.isArray(chapter.sourceClips) ? chapter.sourceClips : [];
          paragraphs.forEach((paragraph, index) => {
            const paragraphId = "note-" + chapter.id + "-p" + (index + 1);
            paragraph.id = paragraph.id || paragraphId;
            paragraph.dataset.noteParagraph = paragraph.id;
            paragraph.dataset.noteChapter = chapter.id;
            let strip = paragraph.nextElementSibling;
            if (!strip?.classList.contains("source-clip-strip") || strip.dataset.forParagraph !== paragraph.id) {
              strip = document.createElement("div");
              strip.className = "source-clip-strip";
              strip.dataset.forParagraph = paragraph.id;
              paragraph.insertAdjacentElement("afterend", strip);
            }
            const paragraphClips = clips.filter((clip) => Number(clip.afterParagraph) === index + 1);
            paragraphClips.forEach((clip) => {
              if (!strip.querySelector('[data-clip-id="' + CSS.escape(clip.id) + '"]')) strip.append(makeSourceClipButton(clip));
            });
            strip.classList.toggle("has-source-clip", paragraphClips.length > 0 || Boolean(strip.querySelector(".source-clip-play")));
            if (!strip.querySelector("[data-note-trigger]")) {
              const noteButton = document.createElement("button");
              noteButton.className = "paragraph-note-trigger";
              noteButton.dataset.noteTrigger = paragraph.id;
              noteButton.textContent = "＋ 笔记";
              strip.append(noteButton);
            }
          });
        });
        updateNoteUi();
      }

      function closeNoteEditor() {
        activeNoteEditor?.editor.remove();
        activeNoteEditor = null;
      }

      function openNoteEditor(paragraphId, noteId = null) {
        const paragraph = document.getElementById(paragraphId);
        if (!paragraph) return;
        closeNoteEditor();
        const existing = noteId ? appState.notes.find((note) => note.id === noteId) : null;
        const chapterId = paragraph.dataset.noteChapter;
        const chapter = data.chapters.find((item) => item.id === chapterId);
        const strip = paragraph.nextElementSibling?.classList.contains("source-clip-strip") ? paragraph.nextElementSibling : null;
        const clipButton = strip?.querySelector(".source-clip-play");
        const selectedQuote = lastTextSelection?.paragraphId === paragraphId ? lastTextSelection.text : "";
        lastTextSelection = null;
        const quote = existing?.quote || selectedQuote || paragraph.textContent.replace(/\s+/g, " ").trim();
        const start = existing?.start ?? (clipButton ? Number(clipButton.dataset.clipStart) : chapter?.start);
        const end = existing?.end ?? (clipButton ? Number(clipButton.dataset.clipEnd) : chapter?.end);
        const precise = Boolean(existing?.precise ?? clipButton);
        const editor = document.createElement("section");
        editor.className = "note-editor";
        editor.innerHTML = '<header><strong>' + (existing ? "编辑笔记" : "记录这一段") + '</strong><span>' + (precise ? "原片 " : "本章 ") + formatTime(start) + "–" + formatTime(end) + '</span></header><label>摘录<textarea class="note-quote" rows="3" maxlength="1200"></textarea></label><label>我的理解<textarea class="note-body" rows="4" maxlength="4000" placeholder="写下判断、疑问或可迁移的经验……"></textarea></label><footer><button class="note-cancel" data-note-cancel>取消</button><button class="note-save" data-note-save>保存笔记</button></footer>';
        editor.querySelector(".note-quote").value = quote;
        editor.querySelector(".note-body").value = existing?.body || "";
        strip.insertAdjacentElement("afterend", editor);
        activeNoteEditor = { editor, paragraphId, chapterId, noteId, start, end, precise };
        editor.querySelector(".note-body").focus();
        editor.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      function saveActiveNote() {
        if (!activeNoteEditor) return;
        const quote = activeNoteEditor.editor.querySelector(".note-quote").value.trim();
        const body = activeNoteEditor.editor.querySelector(".note-body").value.trim();
        if (!quote && !body) return;
        const existingIndex = appState.notes.findIndex((note) => note.id === activeNoteEditor.noteId);
        const chapter = data.chapters.find((item) => item.id === activeNoteEditor.chapterId);
        const previous = existingIndex >= 0 ? appState.notes[existingIndex] : null;
        const note = {
          id: previous?.id || "note-" + Date.now(),
          paragraphId: activeNoteEditor.paragraphId,
          chapterId: activeNoteEditor.chapterId,
          chapterLabel: chapter?.label || "正文",
          quote,
          body,
          start: activeNoteEditor.start,
          end: activeNoteEditor.end,
          precise: activeNoteEditor.precise,
          createdAt: previous?.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        if (existingIndex >= 0) appState.notes.splice(existingIndex, 1, note);
        else appState.notes.unshift(note);
        appState.notes = appState.notes.slice(0, 300);
        persistState();
        closeNoteEditor();
        updateNoteUi();
        if (utilityDrawer.classList.contains("open")) renderNotes();
      }

      function removeNote(noteId) {
        appState.notes = appState.notes.filter((note) => note.id !== noteId);
        persistState();
        updateNoteUi();
        renderNotes();
      }

      function renderNotes() {
        updateNoteUi();
        if (!appState.notes.length) {
          noteContents.innerHTML = '<div class="bookmark-empty">还没有笔记。可在正文段落下点击“＋ 笔记”；先选中文字，再点击会只摘录选中的句子。</div>';
          return;
        }
        noteContents.innerHTML = '<div class="note-list">' + appState.notes.map((note) => '<article class="note-item"><button class="note-item-main" data-note-go="' + escapeText(note.id) + '"><span>' + escapeText(note.chapterLabel) + ' · ' + formatTime(note.start) + (note.precise ? " 精确片段" : " 本章范围") + '</span><blockquote>' + escapeText(note.quote) + '</blockquote>' + (note.body ? '<p>' + escapeText(note.body) + '</p>' : "") + '</button><footer><button data-note-play="' + escapeText(note.id) + '">▶ 原片</button><button data-note-edit="' + escapeText(note.id) + '">编辑</button><button data-note-remove="' + escapeText(note.id) + '">删除</button></footer></article>').join("") + '</div>';
      }

      function goToNote(note, edit = false) {
        if (!note) return;
        closeDrawer();
        activateView("study", false);
        const paragraph = document.getElementById(note.paragraphId);
        paragraph?.classList.add("note-focus");
        setTimeout(() => {
          paragraph?.scrollIntoView({ behavior: "smooth", block: "center" });
          if (edit) openNoteEditor(note.paragraphId, note.id);
          setTimeout(() => paragraph?.classList.remove("note-focus"), 1800);
        }, 100);
      }

      function playNoteSource(note) {
        if (!note) return;
        closeDrawer();
        clearActiveClip();
        activeClip = {
          start: note.start,
          end: note.end,
          label: note.chapterLabel + " · 笔记原片",
          button: null,
          returnTargetId: note.paragraphId,
          returnScrollY: window.scrollY,
        };
        returnToReading.hidden = false;
        seekVideo(note.start, { keepClip: true });
        dockTitle.textContent = activeClip.label;
        dockTime.textContent = formatTime(note.start) + "–" + formatTime(note.end) + " · " + (note.precise ? "短片段播放" : "章节回看");
      }

      function exportNotesMarkdown() {
        if (!appState.notes.length) return;
        const ordered = [...appState.notes].sort((a, b) => a.start - b.start || a.createdAt - b.createdAt);
        const lines = [
          "# " + data.metadata.title + "：我的学习笔记",
          "",
          "- 原视频：" + data.canonicalUrl,
          "- 导出时间：" + new Date().toLocaleString("zh-CN"),
          "",
        ];
        ordered.forEach((note) => {
          lines.push("## " + note.chapterLabel + " · " + formatTime(note.start) + "–" + formatTime(note.end));
          lines.push("");
          if (note.quote) lines.push("> " + note.quote.replace(/\n/g, "\n> "), "");
          if (note.body) lines.push(note.body, "");
          lines.push("[回到原片](" + data.canonicalUrl + "?t=" + Math.floor(note.start) + ")", "");
        });
        const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.metadata.title.replace(/[\\/:*?\"<>|]/g, "-").slice(0, 80) + "-我的笔记.md";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      function updateTimelineSearch() {
        const query = timelineSearch.value.trim().toLowerCase();
        timelineMatches = [];
        timelineMatchIndex = -1;
        timelineRows.forEach((row) => {
          const headingMatch = Boolean(query) && row.dataset.headingSearch.includes(query);
          const blocks = [...row.querySelectorAll(".cleaned-block")];
          let blockMatches = 0;
          blocks.forEach((block) => {
            const directMatch = Boolean(query) && block.dataset.cleanedSearch.includes(query);
            const visible = !query || headingMatch || directMatch;
            block.classList.toggle("search-hidden", !visible);
            block.classList.remove("search-current");
            const text = cleanedOriginalText.get(block) || "";
            setHighlightedText(block.querySelector(".cleaned-text"), text, directMatch ? query : "");
            if (directMatch) {
              timelineMatches.push(block);
              blockMatches += 1;
            }
          });
          const rowMatch = !query || headingMatch || blockMatches > 0;
          row.classList.toggle("search-hidden", !rowMatch);
          if (query && rowMatch) row.querySelector(".timeline-transcript").open = true;
          if (headingMatch && blockMatches === 0) timelineMatches.push(row);
        });
        const visibleChapters = timelineRows.filter((row) => !row.classList.contains("search-hidden")).length;
        timelineSearchCount.textContent = query ? visibleChapters + " 章 · " + timelineMatches.length + " 处" : data.chapters.length + " 章 · " + cleanedBlocks.length + " 段";
        timelineResultPosition.textContent = query ? (timelineMatches.length ? "共 " + timelineMatches.length + " 处匹配" : "没有匹配内容") : "输入关键词后可逐条定位";
        timelineSearchPrev.disabled = timelineMatches.length === 0;
        timelineSearchNext.disabled = timelineMatches.length === 0;
      }

      function moveTimelineMatch(step) {
        if (!timelineMatches.length) return;
        timelineMatches.forEach((node) => node.classList.remove("search-current"));
        timelineMatchIndex = (timelineMatchIndex + step + timelineMatches.length) % timelineMatches.length;
        const target = timelineMatches[timelineMatchIndex];
        target.classList.add("search-current");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        timelineResultPosition.textContent = "第 " + (timelineMatchIndex + 1) + " / " + timelineMatches.length + " 处";
      }

      function updateProgressUI() {
        const progress = Math.round(Number(appState.reading.progress) || 0);
        document.getElementById("readingProgress").style.width = progress + "%";
        document.getElementById("navReadingProgress").style.width = progress + "%";
        document.getElementById("readingProgressLabel").textContent = "阅读 " + progress + "%";
        document.getElementById("readingProgressMeta").textContent = progress + "%";
        document.getElementById("readChapterCount").textContent = appState.reading.readChapters.length + "/" + data.chapters.length + " 已读";
        document.getElementById("continueReading").classList.toggle("available", progress > 1 || appState.reading.scrollY > 0);
        document.querySelectorAll(".toc-link").forEach((link) => {
          const targetId = link.dataset.scroll.replace("#chapter-", "");
          link.classList.toggle("read", appState.reading.readChapters.includes(targetId));
        });
      }

      function captureReadingProgress() {
        if (!progressTrackingEnabled) return;
        if (!document.getElementById("view-study").classList.contains("active")) return;
        const article = document.querySelector("#view-study article");
        const start = article.getBoundingClientRect().top + window.scrollY;
        const total = Math.max(1, article.offsetHeight - window.innerHeight);
        const progress = Math.min(100, Math.max(0, ((window.scrollY - start) / total) * 100));
        appState.reading.progress = progress;
        appState.reading.scrollY = window.scrollY;
        updateProgressUI();
        clearTimeout(progressTimer);
        progressTimer = setTimeout(persistState, 240);
      }

      function resumeReading() {
        activateView("study", false);
        setTimeout(() => window.scrollTo({ top: Number(appState.reading.scrollY) || 0, behavior: "smooth" }), 90);
      }

      document.addEventListener("click", (event) => {
        const sourceClip = event.target.closest("[data-clip-start][data-clip-end]");
        if (sourceClip) playSourceClip(sourceClip);
        const seek = event.target.closest("[data-seek]");
        if (seek) seekVideo(seek.dataset.seek);
        const scroll = event.target.closest("[data-scroll]");
        if (scroll) document.querySelector(scroll.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
        const openTimeline = event.target.closest("[data-open-timeline]");
        if (openTimeline) {
          activateView("timeline");
          const row = document.querySelector("[data-timeline-chapter='" + openTimeline.dataset.openTimeline + "']");
          const details = row?.querySelector(".timeline-transcript");
          if (details) details.open = true;
          setTimeout(() => row?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
        }
        const chapterBookmark = event.target.closest("[data-bookmark-chapter]");
        if (chapterBookmark) toggleChapterBookmark(chapterBookmark.dataset.bookmarkChapter);
        const suggestion = event.target.closest("[data-search-suggestion]");
        if (suggestion) {
          globalSearch.value = suggestion.dataset.searchSuggestion;
          renderGlobalSearch();
        }
        const result = event.target.closest("[data-global-result]");
        if (result) openSearchResult(globalMatches[Number(result.dataset.globalResult)]);
        const bookmarkGo = event.target.closest("[data-bookmark-go]");
        if (bookmarkGo) {
          closeDrawer();
          activateView("study", false);
          setTimeout(() => document.getElementById("chapter-" + bookmarkGo.dataset.bookmarkGo)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
        const bookmarkRemove = event.target.closest("[data-bookmark-remove]");
        if (bookmarkRemove) toggleChapterBookmark(bookmarkRemove.dataset.bookmarkRemove);
        const momentGo = event.target.closest("[data-moment-go]");
        if (momentGo) {
          closeDrawer();
          seekVideo(momentGo.dataset.momentGo);
        }
        const momentRemove = event.target.closest("[data-moment-remove]");
        if (momentRemove) {
          appState.bookmarks.moments = appState.bookmarks.moments.filter((item) => item.id !== momentRemove.dataset.momentRemove);
          persistState();
          renderBookmarkButtons();
          renderBookmarks();
        }
        const noteTrigger = event.target.closest("[data-note-trigger]");
        if (noteTrigger) openNoteEditor(noteTrigger.dataset.noteTrigger);
        if (event.target.closest("[data-note-cancel]")) closeNoteEditor();
        if (event.target.closest("[data-note-save]")) saveActiveNote();
        const noteGo = event.target.closest("[data-note-go]");
        if (noteGo) goToNote(appState.notes.find((note) => note.id === noteGo.dataset.noteGo));
        const notePlay = event.target.closest("[data-note-play]");
        if (notePlay) playNoteSource(appState.notes.find((note) => note.id === notePlay.dataset.notePlay));
        const noteEdit = event.target.closest("[data-note-edit]");
        if (noteEdit) goToNote(appState.notes.find((note) => note.id === noteEdit.dataset.noteEdit), true);
        const noteRemove = event.target.closest("[data-note-remove]");
        if (noteRemove) removeNote(noteRemove.dataset.noteRemove);
      });

      tabs.forEach((tab) => tab.addEventListener("click", () => activateView(tab.dataset.view)));
      timelineSearch.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(updateTimelineSearch, 80);
      });
      timelineSearchPrev.addEventListener("click", () => moveTimelineMatch(-1));
      timelineSearchNext.addEventListener("click", () => moveTimelineMatch(1));
      globalSearch.addEventListener("input", renderGlobalSearch);
      globalSearch.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); selectGlobalMatch(1); }
        if (event.key === "ArrowUp") { event.preventDefault(); selectGlobalMatch(-1); }
        if (event.key === "Enter" && globalMatches.length) { event.preventDefault(); openSearchResult(globalMatches[Math.max(0, globalMatchIndex)]); }
      });
      document.getElementById("globalSearchPrev").addEventListener("click", () => selectGlobalMatch(-1));
      document.getElementById("globalSearchNext").addEventListener("click", () => selectGlobalMatch(1));
      document.getElementById("globalSearchToggle").addEventListener("click", () => openDrawer("search"));
      document.getElementById("bookmarkToggle").addEventListener("click", () => openDrawer("bookmarks"));
      notesToggle.addEventListener("click", () => openDrawer("notes"));
      document.getElementById("exportNotes").addEventListener("click", exportNotesMarkdown);
      document.getElementById("closeUtilityDrawer").addEventListener("click", closeDrawer);
      utilityBackdrop.addEventListener("click", closeDrawer);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeDrawer();
        if (appState.player.focusMode) setFocusMode(false);
      });
      document.getElementById("readingResume").addEventListener("click", resumeReading);
      document.getElementById("continueReading").addEventListener("click", resumeReading);
      status.addEventListener("click", openPlayerWithoutPlaying);
      document.getElementById("closeDock").addEventListener("click", () => activeClip ? returnToClipOrigin(true) : setDockOpen(false, true));
      returnToReading.addEventListener("click", () => returnToClipOrigin(false));
      document.getElementById("compactDock").addEventListener("click", () => {
        if (appState.player.mode === "compact") applyDockMode(appState.player.previousMode || "floating");
        else {
          appState.player.previousMode = appState.player.mode;
          applyDockMode("compact");
        }
      });
      document.getElementById("splitDock").addEventListener("click", () => applyDockMode(appState.player.mode === "split" ? "floating" : "split"));
      focusModeToggle.addEventListener("click", () => setFocusMode(!appState.player.focusMode));
      focusExit.addEventListener("click", () => setFocusMode(false));
      dock.addEventListener("pointermove", revealFocusUi);
      dock.addEventListener("pointerleave", () => {
        if (appState.player.focusMode && !video.paused) dock.classList.remove("focus-ui-visible");
      });
      document.getElementById("togglePlayback").addEventListener("click", toggleVideoPlayback);
      videoSurfacePlay.addEventListener("click", toggleVideoPlayback);
      video.addEventListener("click", toggleVideoPlayback);
      document.getElementById("skipBack").addEventListener("click", () => skipVideo(-10));
      document.getElementById("skipForward").addEventListener("click", () => skipVideo(10));
      playbackRate.addEventListener("change", () => {
        const rate = Number(playbackRate.value) || 1;
        video.playbackRate = rate;
        appState.player.rate = rate;
        persistState();
      });
      function setSubtitleMode(mode) {
        if (!["raw", "cleaned", "off"].includes(mode)) return;
        if (mode !== "off") appState.player.lastSubtitleMode = mode;
        appState.player.subtitleMode = mode;
        lastSubtitleKey = null;
        updateSubtitles(video.currentTime || appState.player.time || 0, true);
        persistState();
      }
      subtitleCleanedMode.addEventListener("click", () => setSubtitleMode("cleaned"));
      subtitleRawMode.addEventListener("click", () => setSubtitleMode("raw"));
      subtitleVisibilityToggle.addEventListener("click", () => {
        setSubtitleMode(appState.player.subtitleMode === "off" ? appState.player.lastSubtitleMode : "off");
      });
      dockSeek.addEventListener("pointerdown", () => { isSeeking = true; });
      dockSeek.addEventListener("input", () => {
        const target = Number(dockSeek.value) || 0;
        video.currentTime = target;
        dockCurrentTime.textContent = formatTime(target);
        updateSubtitles(target, true);
      });
      const finishSeeking = () => {
        isSeeking = false;
        appState.player.time = video.currentTime || 0;
        updatePlayerRange(video.currentTime || 0);
        persistState();
      };
      dockSeek.addEventListener("change", finishSeeking);
      dockSeek.addEventListener("pointerup", finishSeeking);
      volumeControl.addEventListener("input", () => {
        video.volume = Number(volumeControl.value);
        if (video.volume > 0) video.muted = false;
      });
      muteToggle.addEventListener("click", () => { video.muted = !video.muted; });
      document.getElementById("fullscreenDock").addEventListener("click", () => {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else dock.requestFullscreen?.();
      });
      document.getElementById("saveMoment").addEventListener("click", saveCurrentMoment);

      dock.addEventListener("keydown", (event) => {
        if (["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(event.target.tagName)) return;
        if (event.key === " ") { event.preventDefault(); toggleVideoPlayback(); }
        if (event.key === "ArrowLeft") { event.preventDefault(); skipVideo(-5); }
        if (event.key === "ArrowRight") { event.preventDefault(); skipVideo(5); }
        if (event.key.toLowerCase() === "m") { event.preventDefault(); video.muted = !video.muted; }
        if (event.key.toLowerCase() === "f") { event.preventDefault(); document.getElementById("fullscreenDock").click(); }
        if (event.key.toLowerCase() === "c") { event.preventDefault(); setFocusMode(!appState.player.focusMode); }
      });

      document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
        const text = selection.toString().replace(/\s+/g, " ").trim();
        if (text.length < 2) return;
        const ancestor = selection.getRangeAt(0).commonAncestorContainer;
        const node = ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;
        const paragraph = node?.closest?.("[data-note-paragraph]");
        if (paragraph && selection.anchorNode && selection.focusNode && paragraph.contains(selection.anchorNode) && paragraph.contains(selection.focusNode)) {
          lastTextSelection = { paragraphId: paragraph.id, text: text.slice(0, 1200) };
        }
      });

      video.addEventListener("timeupdate", () => {
        const current = video.currentTime;
        const chapter = chapterForTime(current);
        if (activeClip?.finished) {
          dockTime.textContent = "片段播放完毕 · " + formatTime(activeClip.start) + "–" + formatTime(activeClip.end);
          status.textContent = "片段已完成 · " + activeClip.label;
        } else if (activeClip && current >= activeClip.end - 0.08) {
          video.pause();
          activeClip.finished = true;
          activeClip.button?.classList.remove("playing");
          activeClip.button?.classList.add("completed");
          dockTime.textContent = "片段播放完毕 · " + formatTime(activeClip.start) + "–" + formatTime(activeClip.end);
          status.textContent = "片段已完成 · " + activeClip.label;
        } else if (activeClip) {
          dockTime.textContent = formatTime(current) + " / " + formatTime(activeClip.end) + " · " + activeClip.label;
          status.textContent = (video.paused ? "▶" : "❚❚") + " " + formatTime(current) + " · " + activeClip.label;
        } else {
          dockTime.textContent = formatTime(current) + " / " + formatTime(video.duration || data.metadata.duration_seconds) + " · " + (chapter?.label || "原视频");
          status.textContent = (video.paused ? "▶" : "❚❚") + " " + formatTime(current) + " · " + (chapter?.label || "原视频");
        }
        updatePlayerRange(current);
        updateSubtitles(current);
        document.querySelectorAll(".transcript-line.playing").forEach((line) => line.classList.remove("playing"));
        const segment = timedEntry(data.transcript, current)?.item;
        if (segment) document.querySelector("[data-segment='" + segment.index + "']")?.classList.add("playing");
        if (Date.now() - lastVideoPersist > 1200) {
          appState.player.time = current;
          persistState();
          lastVideoPersist = Date.now();
        }
      });
      video.addEventListener("play", () => setPlaybackUi(false));
      video.addEventListener("pause", () => setPlaybackUi(true));
      video.addEventListener("loadedmetadata", () => {
        restoreVideoTime();
        updatePlayerRange(video.currentTime || appState.player.time || 0);
        updateSubtitles(video.currentTime || appState.player.time || 0, true);
      });
      video.addEventListener("durationchange", () => updatePlayerRange(video.currentTime || 0));
      video.addEventListener("ratechange", () => {
        appState.player.rate = video.playbackRate;
        playbackRate.value = String(video.playbackRate);
        persistState();
      });
      video.addEventListener("volumechange", () => {
        appState.player.volume = video.volume;
        appState.player.muted = video.muted;
        volumeControl.value = String(video.volume);
        muteToggle.textContent = video.muted || video.volume === 0 ? "静音" : (video.volume < .55 ? "小声" : "声音");
        muteToggle.classList.toggle("muted", video.muted || video.volume === 0);
        persistState();
      });
      document.addEventListener("fullscreenchange", () => {
        const button = document.getElementById("fullscreenDock");
        button.textContent = document.fullscreenElement ? "退出" : "⛶";
        button.setAttribute("aria-label", document.fullscreenElement ? "退出全屏" : "全屏播放器");
      });

      const chapters = [...document.querySelectorAll(".chapter")];
      const tocLinks = [...document.querySelectorAll(".toc-link")];
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        tocLinks.forEach((link) => link.classList.toggle("active", link.dataset.scroll === "#" + visible.target.id));
        const chapterId = visible.target.id.replace("chapter-", "");
        appState.reading.chapterId = chapterId;
        if (!appState.reading.readChapters.includes(chapterId)) appState.reading.readChapters.push(chapterId);
        updateProgressUI();
        persistState();
      }, { rootMargin: "-20% 0px -60%", threshold: [0.05, .2, .5] });
      chapters.forEach((chapter) => observer.observe(chapter));

      window.addEventListener("scroll", captureReadingProgress, { passive: true });
      window.addEventListener("wheel", () => { progressTrackingEnabled = true; }, { passive: true });
      window.addEventListener("touchmove", () => { progressTrackingEnabled = true; }, { passive: true });
      window.addEventListener("pointerdown", () => { progressTrackingEnabled = true; }, { passive: true });
      window.addEventListener("keydown", (event) => {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) progressTrackingEnabled = true;
      });
      window.addEventListener("resize", () => applyDockMode(appState.player.mode));
      window.addEventListener("beforeunload", () => {
        appState.player.time = video.currentTime || appState.player.time;
        persistState();
      });

      video.playbackRate = Number(appState.player.rate) || 1;
      video.volume = appState.player.volume;
      video.muted = Boolean(appState.player.muted);
      playbackRate.value = String(video.playbackRate);
      volumeControl.value = String(video.volume);
      setPlaybackUi(video.paused);
      updateSubtitles(appState.player.time || 0, true);
      updatePlayerRange(appState.player.time || 0);
      if (video.readyState >= 1) restoreVideoTime();

      applyDockMode(appState.player.mode);
      setFocusMode(appState.player.focusMode);
      setDockOpen(appState.player.open);
      setupParagraphTools();
      renderBookmarkButtons();
      updateNoteUi();
      updateTimelineSearch();
      updateProgressUI();
      if (appState.player.time > 0) status.textContent = "继续 " + formatTime(appState.player.time) + " · " + chapterForTime(appState.player.time).label;
    })();
