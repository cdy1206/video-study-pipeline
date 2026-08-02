# Video Study Pipeline Skill

把 Bilibili、YouTube、ASR 文稿、演讲稿、会议记录、文章、网页或 PDF，重构为带来源、视觉资产和质量门禁的深度学习材料。

这个仓库采用开放的 Agent Skills 目录结构：一个 `SKILL.md` 入口，加上可按需读取的 `scripts/`、`references/` 和 `assets/`。Codex 是当前的参考运行环境；Claude Code、Cursor、OpenCode、GitHub Copilot、Gemini CLI 和 Windsurf 也能发现这种 Skill，但最终效果仍取决于客户端可用的浏览器、Shell、PDF、图像、ASR 和渲染工具。

## 能做什么

主流程：

```text
source
  -> unified_source + source_manifest
  -> deep_note.md
  -> asset_manifest + reviewed assets
  -> renderer-specific brief
  -> HTML / PDF / Presentation
  -> content recall and render QA
```

支持的输入：

- Bilibili、YouTube、BV 号和稍后再看链接
- 已有字幕、SRT、VTT 或 ASR 转写稿
- 演讲稿、会议记录、文章、网页和 Markdown
- PDF 或其他可提取正文、图片、表格和公式的文档

支持的输出：

- `article-html-only`：图文长文 HTML
- `pdf-only`：LaTeX 深度讲义 PDF
- `presentation-only`：16:9 Web Presentation
- 任意两种组合，或 `all`

本 Skill 不把 `deep_note.md` 机械转换成三种格式。HTML、PDF 和 Presentation 会分别生成自己的渲染规划，重新选择信息密度、版式和资产位置。

## 兼容性

“能发现 Skill”不等于“产物完全一致”。不同客户端提供的工具、权限模型和上下文策略不同。

| 客户端 | 用户级目录 | 项目级目录 | 调用方式 | 当前说明 |
| --- | --- | --- | --- | --- |
| OpenAI Codex | `~/.agents/skills/`；现有 Codex 安装也可用 `~/.codex/skills/` | `.agents/skills/` | 输入 `$video-study-pipeline`，或在 Skills 列表选择 | 参考环境，已做完整安装和回归测试 |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` | `/video-study-pipeline` 或自然语言触发 | 原生支持 `SKILL.md`；渲染工具需自行具备 |
| Cursor | `~/.agents/skills/` 或 `~/.cursor/skills/` | `.agents/skills/` 或 `.cursor/skills/` | `/video-study-pipeline` 或自动触发 | 也会读取 Claude/Codex 兼容目录 |
| OpenCode | `~/.agents/skills/` 或 `~/.config/opencode/skills/` | `.agents/skills/` 或 `.opencode/skills/` | V2 可用 `/video-study-pipeline`，也可自动触发 | 检查 `skill` 权限未被设为 `deny` |
| GitHub Copilot / VS Code | `~/.agents/skills/` 或 `~/.copilot/skills/` | `.agents/skills/` 或 `.github/skills/` | `/video-study-pipeline` 或自动触发 | 适用于 Copilot CLI、VS Code Agent 和 Copilot coding agent |
| Gemini CLI | `~/.agents/skills/` 或 `~/.gemini/skills/` | `.agents/skills/` 或 `.gemini/skills/` | 明确要求“使用 video-study-pipeline Skill”，用 `/skills list` 检查 | 支持 `/skills reload` 重新扫描 |
| Windsurf Cascade | `~/.agents/skills/` 或 `~/.codeium/windsurf/skills/` | `.agents/skills/` 或 `.windsurf/skills/` | `@video-study-pipeline` 或自动触发 | 原生支持 Agent Skills |

如果同时使用多个客户端，优先安装到 `~/.agents/skills/`。Codex、Cursor、OpenCode、Copilot、Gemini CLI 和 Windsurf 都会扫描这个共享目录。Claude Code 使用 `~/.claude/skills/`，可以链接到同一份仓库，不必维护第二份副本。

## 安装前准备

仓库当前为私有仓库。新电脑需要安装 Git 和 [GitHub CLI](https://cli.github.com/)，并让登录账号拥有仓库访问权限：

```bash
gh auth login
gh auth setup-git
gh auth status
```

后续命令以 macOS/Linux/WSL 为例。Windows PowerShell 方案见下文。

## 推荐安装：一份仓库供多个客户端复用

这种方式把 Git 仓库保存在独立位置，再从各客户端的 Skill 目录链接到它。以后只需要一次 `git pull`，所有链接到它的客户端都会同时更新。

```bash
export VIDEO_STUDY_REPO="${XDG_DATA_HOME:-$HOME/.local/share}/video-study-pipeline-repo"

gh repo clone cdy1206/video-study-pipeline "$VIDEO_STUDY_REPO"

export VIDEO_STUDY_SKILL="$VIDEO_STUDY_REPO/video-study-pipeline"
test -f "$VIDEO_STUDY_SKILL/SKILL.md"
```

安装到通用目录：

```bash
mkdir -p "$HOME/.agents/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.agents/skills/video-study-pipeline"
```

再为 Claude Code 添加链接：

```bash
mkdir -p "$HOME/.claude/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.claude/skills/video-study-pipeline"
```

如果目标目录已经存在，不要直接覆盖。先确认它是否为旧链接或旧副本，再备份并替换。

## 按客户端安装

### OpenAI Codex

#### 方案 A：共享 Agent Skills 目录

使用上面的 `~/.agents/skills/video-study-pipeline`。这是目前官方文档推荐的用户级 Agent Skills 位置，适合同时与其他客户端共享。

在新任务里输入：

```text
$video-study-pipeline
https://www.bilibili.com/video/BV...
请深度解读，只输出 HTML。
```

#### 方案 B：Codex 内置 Skill Installer

这个仓库已经验证过 Git 模式安装。私有仓库建议使用 `--method git`，它会复用 `gh auth setup-git` 配置的凭据：

```bash
python3 \
  "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo cdy1206/video-study-pipeline \
  --path video-study-pipeline \
  --method git
```

安装器不会覆盖同名目录。更新前请按“更新”章节备份旧版本。

### Claude Code

Claude Code 的个人 Skill 路径是 `~/.claude/skills/<skill-name>/SKILL.md`：

```bash
mkdir -p "$HOME/.claude/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.claude/skills/video-study-pipeline"
```

调用示例：

```text
/video-study-pipeline https://www.youtube.com/watch?v=...
只生成 HTML，先检查字幕或 ASR 是否完整。
```

如果启动 Claude Code 时 `~/.claude/skills/` 尚不存在，创建后未被当前会话发现，可以重启 Claude Code。新版 Claude Code 会监听已存在的 Skill 目录变化。

### Cursor

Cursor 可以直接使用共享的 `~/.agents/skills/`。如果希望使用 Cursor 专属目录：

```bash
mkdir -p "$HOME/.cursor/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.cursor/skills/video-study-pipeline"
```

在 Agent 对话框输入 `/video-study-pipeline`，或直接提供视频链接并要求深度解读。也可以在 Cursor 的 Customize 页面通过 GitHub 地址添加远程规则，但对于私有仓库，命令行克隆更容易确认认证状态和具体版本。

### OpenCode

OpenCode 可以读取共享的 `~/.agents/skills/`。专属目录安装方式：

```bash
mkdir -p "$HOME/.config/opencode/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.config/opencode/skills/video-study-pipeline"
```

如果 Skill 没有出现，检查 `opencode.json` 或 `opencode.jsonc` 中的 `skill` 权限，确认 `video-study-pipeline` 没有被设置为 `deny`。OpenCode V2 可通过 `/video-study-pipeline` 调用。

### GitHub Copilot CLI / VS Code Agent

两者都可以读取共享的 `~/.agents/skills/`。如果希望使用 Copilot 专属目录：

```bash
mkdir -p "$HOME/.copilot/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.copilot/skills/video-study-pipeline"
```

项目级安装可以放到 `.github/skills/video-study-pipeline/` 或 `.agents/skills/video-study-pipeline/`。在聊天中输入 `/video-study-pipeline`，或者让 Copilot 根据 `description` 自动选择。

### Gemini CLI

Gemini CLI 可以读取共享的 `~/.agents/skills/`。专属目录安装方式：

```bash
mkdir -p "$HOME/.gemini/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.gemini/skills/video-study-pipeline"
```

进入 Gemini CLI 后检查并刷新：

```text
/skills list
/skills reload
```

使用时明确说明“使用 `video-study-pipeline` Skill 解读这个链接”。Gemini 由 `activate_skill` 工具加载 Skill，不要把 Codex 的 `$skill-name` 语法照搬过去。

### Windsurf Cascade

Windsurf 会扫描共享的 `~/.agents/skills/`。专属全局目录安装方式：

```bash
mkdir -p "$HOME/.codeium/windsurf/skills"
ln -s "$VIDEO_STUDY_SKILL" \
  "$HOME/.codeium/windsurf/skills/video-study-pipeline"
```

在 Cascade 中输入 `@video-study-pipeline`，或让模型根据任务自动调用。项目级 Skill 可以放在 `.windsurf/skills/video-study-pipeline/`。

## Windows PowerShell

Windows 如果没有启用符号链接权限，可以直接复制 Skill。下面以共享的 `.agents/skills` 目录为例：

```powershell
gh auth login
gh auth setup-git

$Repo = Join-Path $HOME ".local\share\video-study-pipeline-repo"
$TargetRoot = Join-Path $HOME ".agents\skills"
$Target = Join-Path $TargetRoot "video-study-pipeline"

gh repo clone cdy1206/video-study-pipeline $Repo
New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null
Copy-Item -Recurse (Join-Path $Repo "video-study-pipeline") $Target
```

Claude Code 需要把同一目录复制到 `$HOME\.claude\skills\video-study-pipeline`。更新复制版时，不要直接把新目录叠加到旧目录；先把旧目录改名备份，再复制新版本。

如果 Windows 已开启 Developer Mode，也可以用 `New-Item -ItemType SymbolicLink` 链接到仓库内的 `video-study-pipeline` 目录，从而获得和 macOS/Linux 相同的一次更新、多端生效体验。

## 项目级安装

如果只希望某个项目使用该 Skill，把完整的 `video-study-pipeline/` 目录复制或链接到对应项目目录：

| 客户端 | 项目级目标目录 |
| --- | --- |
| Codex / 通用 Agent Skills | `<repo>/.agents/skills/video-study-pipeline/` |
| Claude Code | `<repo>/.claude/skills/video-study-pipeline/` |
| Cursor | `<repo>/.cursor/skills/video-study-pipeline/` 或 `<repo>/.agents/skills/video-study-pipeline/` |
| OpenCode | `<repo>/.opencode/skills/video-study-pipeline/` 或 `<repo>/.agents/skills/video-study-pipeline/` |
| GitHub Copilot | `<repo>/.github/skills/video-study-pipeline/` 或 `<repo>/.agents/skills/video-study-pipeline/` |
| Gemini CLI | `<repo>/.gemini/skills/video-study-pipeline/` 或 `<repo>/.agents/skills/video-study-pipeline/` |
| Windsurf | `<repo>/.windsurf/skills/video-study-pipeline/` 或 `<repo>/.agents/skills/video-study-pipeline/` |

最终结构必须满足：

```text
<client-skill-root>/
└── video-study-pipeline/
    ├── SKILL.md
    ├── agents/
    ├── assets/
    ├── references/
    └── scripts/
```

最常见的安装错误是多嵌套了一层目录，例如 `video-study-pipeline/video-study-pipeline/SKILL.md`。安装后请直接检查实际路径。

## 更新

### 共享 Git 仓库 + 符号链接

```bash
git -C "${XDG_DATA_HOME:-$HOME/.local/share}/video-study-pipeline-repo" \
  pull --ff-only
```

链接会立即指向新版本。若客户端没有自动重新扫描，请重启客户端，或使用它提供的 Skills reload/refresh 命令。

### Codex Skill Installer 副本

安装器不会覆盖现有目录。先保留旧版本，再重新安装：

```bash
mv "${CODEX_HOME:-$HOME/.codex}/skills/video-study-pipeline" \
  "${CODEX_HOME:-$HOME/.codex}/skills/video-study-pipeline.backup.$(date +%Y%m%d-%H%M%S)"

python3 \
  "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo cdy1206/video-study-pipeline \
  --path video-study-pipeline \
  --method git
```

## 卸载

如果使用符号链接，只删除客户端目录中的链接，不要删除共享仓库：

```bash
unlink "$HOME/.agents/skills/video-study-pipeline"
unlink "$HOME/.claude/skills/video-study-pipeline"
```

仅执行实际存在且确认为符号链接的路径。其他客户端专属目录同理。

## 运行环境与功能边界

核心校验和打包脚本只使用 Python 3 标准库。完整视频链路可能需要：

- `git` 和 `gh`：安装或更新私有仓库
- `python3`：校验、打包和辅助脚本
- `yt-dlp`、`ffmpeg`：视频、音频、字幕和关键帧处理
- 可用字幕或 ASR 环境：平台字幕不可用时生成完整时间戳转写
- Node.js、浏览器或 Playwright：HTML、Presentation 构建与跨视口检查
- LaTeX/Tectonic/TeX Live：LaTeX 讲义 PDF
- 对应客户端允许的 Shell、文件、浏览器、PDF 和图像工具

Codex 环境中的 `beautiful-article`、`video-render-pdf`、`web-video-presentation`、`pdf`、`playwright` 等 Skill 可以作为实现辅助，但不是仓库安装成功的必要条件。其他客户端没有同名 Skill 时，应使用其已有的等价工具；这可能影响最终视觉质量和自动化程度。

## 验证安装

先确认入口存在：

```bash
test -f "$HOME/.agents/skills/video-study-pipeline/SKILL.md"
```

运行仓库自带回归测试：

```bash
python3 "$HOME/.agents/skills/video-study-pipeline/scripts/test_check_deep_note_blog_style.py"
python3 -m compileall -q \
  "$HOME/.agents/skills/video-study-pipeline/scripts"
```

然后在客户端中列出 Skills，并执行一个低成本测试：

```text
请使用 video-study-pipeline Skill，读取一个现有的 ASR 或 Markdown，
只生成 deep_note.md 和 asset_manifest，不下载视频，也不渲染最终产物。
```

## 常见问题

### 私有仓库无法克隆

运行：

```bash
gh auth status
gh auth setup-git
gh repo view cdy1206/video-study-pipeline
```

如果最后一条命令无权访问，当前 GitHub 账号没有该私有仓库权限。

### Skill 没有出现在客户端中

依次检查：

1. 文件名是否严格为大写 `SKILL.md`。
2. 目录是否多嵌套了一层。
3. `SKILL.md` 的 `name` 是否为 `video-study-pipeline`。
4. 客户端是否扫描了对应的用户级或项目级目录。
5. OpenCode 等客户端是否通过权限配置隐藏了 Skill。
6. 新建顶层目录后是否需要重启或执行 reload/refresh。

### 已发现 Skill，但视频处理失败

这通常不是安装问题。检查 `yt-dlp`、`ffmpeg`、Cookie/登录状态、平台字幕、ASR 服务、网络权限和客户端的 Shell 执行权限。没有完整字幕或 ASR 时，不应仅根据标题、评论或几张截图生成最终讲义。

### 不同客户端生成结果不一致

Agent Skills 统一的是工作流说明，不统一模型、工具和渲染器。Codex 是当前完整验证环境；其他客户端能读取同一套规则，但如果缺少浏览器控制、图像生成、LaTeX、ASR 或辅助 Skill，必须使用等价工具或明确降级，不能把降级结果描述成完整链路。

## 仓库内容

- `video-study-pipeline/SKILL.md`：端到端工作流、交互选项和默认配置
- `video-study-pipeline/references/`：DeepNote、视觉资产、各渲染路线与质量门禁
- `video-study-pipeline/scripts/`：DeepNote/PDF 校验、Presentation 单文件化与交付打包
- `video-study-pipeline/assets/`：LaTeX 讲义回退模板

本仓库不包含视频、音频、字幕、Cookie、API Key、运行日志或历史生成产物。

## 官方文档

- [OpenAI Codex: Build skills](https://developers.openai.com/codex/skills)
- [Claude Code: Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Cursor: Agent Skills](https://cursor.com/docs/skills)
- [OpenCode: Agent Skills](https://opencode.ai/docs/skills)
- [GitHub Copilot: Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
- [Gemini CLI: Managing Agent Skills](https://geminicli.com/docs/cli/using-agent-skills/)
- [Windsurf Cascade: Skills](https://docs.windsurf.com/zh/windsurf/cascade/skills)
