# 质量、隐私与故障处理

本文档面向维护者和需要排查本地环境的使用者。产品介绍、安装方式和基本用法请先阅读仓库根目录的 `README.md`。

## 内容质量

- 不允许从标题、评论、弹幕或封面直接生成所谓深度讲义。
- 视频无可用字幕时，必须先尝试获得音频并完成带时间戳 ASR，或明确说明阻塞原因。
- DeepNote 必须是语义重写，不允许用正则替换、通用填充句或机械扩写凑字数。
- 短小节只能补充来源支持的机制、例子、反例和迁移场景；没有材料就保持简洁。
- 关键帧需要经过视觉检查；普通 talking-head、重复画面和不可读字幕帧应被跳过。
- Mermaid、表格和图片必须服务于相邻论述，不能集中成独立“资产展示章”。

## 渲染质量

- HTML 必须能本地打开，不得出现坏图、原始 Mermaid 代码或播放器空白占位。
- 双字幕、倍速、跳转、音量、全屏、关闭和专注模式需要通过结构与交互检查。
- PDF 不仅要编译成功，还要检查页数、文本、嵌图、分页和代表页面截图。
- Presentation 的图片、表格和图表必须进入有边界的 16:9 布局，不能按原尺寸随意粘贴。

## 隐私边界

本仓库不应包含：

- 原始视频、音频、字幕或 ASR 产物。
- Bilibili / YouTube Cookies 或浏览器登录信息。
- API Key、`.env`、账号凭据或私有下载地址。
- 用户笔记、运行日志、历史生成目录或本地绝对路径。

提交前请检查：

```bash
git status --short
git diff --check
git grep -nE '(API_KEY|COOKIE|Authorization:|/Users/)' -- . ':!docs/quality-and-troubleshooting.md'
```

## 安装后找不到 Skill

1. 确认路径为 `<skills-root>/video-study-pipeline/SKILL.md`，中间没有多套一层仓库目录。
2. 重新打开一个 Agent 会话；部分客户端只在会话启动时扫描 Skills。
3. 明确输入 `$video-study-pipeline` 或让 Agent 先读取该 `SKILL.md`。

## Codex 安装器提示 `CERTIFICATE_VERIFY_FAILED`

这是 Python 本地证书链问题，不代表仓库不可访问。README 的推荐命令已经使用 `--method git`，会通过系统 Git 克隆并绕开 Python ZIP 下载路径。先确认：

```bash
git ls-remote https://github.com/cdy1206/video-study-pipeline.git HEAD
```

如果该命令可以返回 commit hash，重新执行带 `--method git` 的安装命令即可。

## 视频没有字幕

先使用内置的 `scripts/acquire_video.py` 检查实际来源，不要让每个客户端临时拼下载命令。安装依赖、浏览器登录态、云端执行限制和错误码处理统一见 [视频获取说明](../video-study-pipeline/references/source-acquisition.md)。

这不等于任务结束。依次检查：

1. 平台字幕或 uploader 字幕是否存在。
2. `yt-dlp` 是否能取得音频流。
3. Cookie、地区、版权或登录限制是否阻止下载。
4. 是否已配置可输出时间戳的 ASR 后端。

若音频也无法取得，应保留实际命令和错误信息，而不是用元数据猜测内容。

## 本地 HTML 打开后空白

最终 HTML 应尽可能兼容 `file://`。如果浏览器安全策略仍阻止资源加载，可在产物目录启动本地服务器：

```bash
python3 -m http.server 8765
```

然后打开 `http://localhost:8765/`。如果 HTTP 可用而 `file://` 不可用，应继续检查是否仍有外部模块、绝对路径或未内联资源。

## 图片被裁切、过大或留白

- 检查图片自然比例与 renderer 中的 `ratio` / `object-fit`。
- 正文图应有最大宽高和边界容器，不应默认占满整页。
- 关键帧、结构图和对比表应按各自用途使用不同布局。
- 通过真实浏览器截图验收，不能只凭 DOM 或构建成功判断。

## PDF 中出现 Mermaid 源代码

PDF 路线必须先把 Mermaid 渲染为 SVG/PDF/PNG 等视觉资产，再插入文档。最终 PDF 出现 `flowchart TD` 表示渲染门禁失败。
