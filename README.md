# Video Study Pipeline Skill

把 Bilibili、YouTube、ASR 文稿、演讲稿、会议记录、文章、网页或 PDF 重构为带来源、资产与质量门禁的深度学习材料。

主流程：

`source -> unified_source -> deep_note.md -> asset manifest -> renderer brief -> HTML / PDF / presentation -> QA`

## 安装

在新电脑上先登录 GitHub：

```bash
gh auth login
gh auth setup-git
```

然后安装 Skill。私有仓库使用 Git 模式，可复用 `gh` 配置的 Git 凭据并避开 Python 本地证书链差异：

```bash
python3 \
  "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo cdy1206/video-study-pipeline \
  --path video-study-pipeline \
  --method git
```

安装完成后，在新的 Codex 任务中使用 `$video-study-pipeline`，或直接提供视频链接并要求生成 HTML、PDF 或 Presentation。

## 更新

安装器不会覆盖同名 Skill。更新前先保留旧版本，再重新安装：

```bash
mv "${CODEX_HOME:-$HOME/.codex}/skills/video-study-pipeline" \
  "${CODEX_HOME:-$HOME/.codex}/skills/video-study-pipeline.backup.$(date +%Y%m%d-%H%M%S)"

python3 \
  "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo cdy1206/video-study-pipeline \
  --path video-study-pipeline \
  --method git
```

## 运行环境

- 核心校验和打包脚本只使用 Python 3 标准库。
- 视频下载、抽帧和转写通常需要 `yt-dlp`、`ffmpeg` 以及可用的字幕或 ASR 环境。
- PDF、Reacticle HTML 和 Presentation 会按所选输出路线使用本机已有的 LaTeX、Node.js、浏览器及相关 Codex Skills；缺失时按 `SKILL.md` 的回退规则执行。
- 默认交付目录为 `~/Downloads/视频解读/`，可通过打包脚本的 `--out-root` 覆盖。

## 仓库内容

- `video-study-pipeline/SKILL.md`: 端到端工作流、交互选项和用户默认配置。
- `video-study-pipeline/references/`: DeepNote、资产选择、渲染与质量门禁规则。
- `video-study-pipeline/scripts/`: DeepNote/PDF 校验、Presentation 单文件化与交付打包脚本。
- `video-study-pipeline/assets/`: LaTeX 讲义回退模板。

本仓库不包含视频、音频、字幕、Cookies、API Key、运行日志或历史生成产物。
