#!/usr/bin/env python3
"""Regression tests for the DeepNote Blog-style checker."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
CHECKER_PATH = SCRIPT_DIR / "check_deep_note_blog_style.py"
spec = importlib.util.spec_from_file_location("check_deep_note_blog_style", CHECKER_PATH)
checker = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(checker)


def write_note(body_section: str) -> Path:
    text = f"""# 材料标题：测试

> 材料来源：Bilibili
> 材料 ID / 链接 / 路径：BVTEST / https://example.com
> 作者 / 讲者 / 来源角色：测试讲者
> 时长 / 页数 / 文本规模：10:00
> 转写或抽取来源：测试字幕
> 内容类型：课程 / 知识
> 整理密度：精读版
> 整理说明：本文基于 ASR 文稿重构，不是逐字稿。

## 1. 主体正文：按 Blog 方式重构源材料内容

{body_section}

## 2. 判断框架与结论

1. 先确认听众是谁。
2. 再确认他们要带走什么。
"""
    tmpdir = Path(tempfile.mkdtemp(prefix="deepnote-checker-test-"))
    path = tmpdir / "deep_note.md"
    path.write_text(text, encoding="utf-8")
    return path


def write_manifest(data: dict) -> Path:
    tmpdir = Path(tempfile.mkdtemp(prefix="deepnote-manifest-test-"))
    path = tmpdir / "asset_manifest.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


class DeepNoteBlogStyleCheckerTests(unittest.TestCase):
    def test_rejects_generic_padding_paragraphs(self) -> None:
        note = write_note(
            """### 3.1 开场先建立交换关系

开场的任务不是表演，而是让听众知道自己为什么要继续听。一个好开场会迅速说明交换关系：听众投入时间，换来一个更清晰的判断工具、一种新的表达方法，或者一次对旧问题的重新理解。

进一步说，"开场先建立交换关系" 不应该被读成一句孤立结论，而要放回“公开演讲训练”的具体约束里。更有用的读法，是先看这个判断解决了什么问题，再看它依赖哪些前提，最后看它会把行动带向哪里。否则人很容易只记住态度，却没有形成判断能力。

落到实践中，这一层至少要追问三件事：第一，当前处境里的关键变量是什么；第二，哪些变量是个人可以改变的，哪些属于结构性限制；第三，如果下一步要行动，最小可验证动作是什么。这样处理以后，内容就不只是总结，而会变成可以迁移到现实决策中的方法。
"""
        )
        report = checker.check(note)
        self.assertFalse(report["checks"]["no_generic_padding"])
        self.assertFalse(report["passed"])

    def test_allows_natural_speaker_terms_and_concise_sections(self) -> None:
        note = write_note(
            """### 3.1 训练意识比天赋判断更重要

讲者先把问题从“我有没有口才”转成“我是否知道该练什么”。老师反复强调，表达不是把个人魅力展示出来，而是让听众在有限注意力里抓住重点。这个判断需要保留“讲者”和“老师”，因为这里讨论的是课程中的教学关系，不是第三人称偷懒转述。

### 3.2 幻灯片不能和人声抢同一个语言处理器

讲者用课堂场景说明，听众很难一边读密集文字，一边认真听老师解释。这里的重点不是字数越少越好，而是屏幕应该承担视觉锚点，人声承担推理过程。小节可以短，但它已经交代了机制和例子。

| 元素 | 应承担的任务 |
| --- | --- |
| 屏幕 | 给视觉锚点 |
| 人声 | 展开推理过程 |

### 3.3 结尾页要固定贡献

老师最后讨论的不是礼貌，而是记忆。最后一页停在屏幕上，听众自然会把它当成整场表达的收束。如果最后只写“谢谢”，就浪费了最后一次强化贡献的机会。
"""
        )
        report = checker.check(note)
        self.assertTrue(report["checks"]["speaker_terms_used_naturally"])
        self.assertTrue(report["checks"]["short_sections_are_not_forced_failures"])
        self.assertTrue(report["passed"])

    def test_allows_legacy_video_body_heading(self) -> None:
        text = """# 视频标题：测试

## 1. 主体正文：按 Blog 方式重构视频内容

### 3.1 旧视频标题仍然兼容

这里解释的是一个真实机制：表达训练的目的不是让话术更漂亮，而是降低听众理解成本。旧标题来自已经生成过的视频文件，checker 应该兼容它，避免历史产物全部误报。

| 判断点 | 含义 |
| --- | --- |
| 听众成本 | 信息处理负担 |

## 2. 判断框架与结论

1. 先识别听众成本。
"""
        tmpdir = Path(tempfile.mkdtemp(prefix="deepnote-checker-test-"))
        note = tmpdir / "legacy_video_heading.md"
        note.write_text(text, encoding="utf-8")
        report = checker.check(note)
        self.assertTrue(report["checks"]["required_h2_present"])
        self.assertTrue(report["passed"])

    def test_allows_non_video_source_figures_without_keyframes(self) -> None:
        note = write_note(
            """### 3.1 PDF 图表是证据，不需要伪造视频关键帧

一份 PDF 或网页文章里的图表，本身就可以承担证据功能。只要它保留了来源页码、图注和插入位置，就不应该被 checker 当成“没有关键帧”的失败视频任务。

【图片：fig-001，caption=论文第一页的方法结构图，source_page=3，intent=evidence，reason=这是原始 PDF 中支撑方法说明的图表证据】
"""
        )
        manifest = write_manifest(
            {
                "source": {
                    "type": "pdf",
                    "source_path": "/tmp/example.pdf",
                },
                "source_images": [
                    {
                        "id": "fig-001",
                        "path": "assets/source_figures/fig-001.png",
                        "insert": True,
                        "caption": "论文第一页的方法结构图",
                    }
                ],
                "generated_diagrams": [],
                "tables": [],
            }
        )
        report = checker.check(note, manifest)
        self.assertTrue(report["checks"]["keyframes_selected_or_absence_documented"])
        self.assertTrue(report["checks"]["manifest_insert_assets_referenced"])
        self.assertTrue(report["passed"])

    def test_rejects_low_information_mermaid_structure_map(self) -> None:
        note = write_note(
            """### 3.1 一张结构图必须解释内容，而不是复述目录

真正有用的结构图要把变量、机制、例子和结论放进去。如果只是把章节名串成箭头，读者并不会获得比目录更多的信息。

```mermaid
flowchart TD
  A[一红16年，干啥啥赚钱？] --> B[背景问题]
  B --> C[核心概念]
  C --> D[论证链条]
  D --> E[可迁移框架]
  E --> F[总结]
```
"""
        )
        report = checker.check(note)
        self.assertFalse(report["checks"]["no_low_information_mermaid"])
        self.assertFalse(report["passed"])

    def test_rejects_legacy_reading_navigation_section(self) -> None:
        legacy = """# 视频标题：测试

## 0. 观点卡片

**核心主张**：表达训练要服务听众理解。

## 1. 阅读导航：如何读这期视频

| 阅读入口 | 说明 |
| --- | --- |
| 适合人群 | 需要公开表达的人 |

## 2. 背景与问题：为什么这个话题值得讨论

旧结构还保留阅读导航。

## 3. 核心概念与术语

| 概念 / 术语 | 视频中的含义 | 为什么重要 | 备注 |
| --- | --- | --- | --- |
| 认知负荷 | 听众处理信息的压力 | 决定表达边界 | 无 |

## 4. 全文结构图：这期视频的论证地图

```mermaid
flowchart LR
  A --> B
```

## 5. 主体正文：按 Blog 方式重构视频内容

### 5.1 旧结构主体

正文。

## 6. 可迁移的判断框架 / 行动框架

1. 方法。

## 7. 总结：最值得带走的 3-5 个结论

1. **含义**：总结。**为什么重要**：重要。**如何使用**：使用。
"""
        tmpdir = Path(tempfile.mkdtemp(prefix="deepnote-checker-test-"))
        note = tmpdir / "legacy_deep_note.md"
        note.write_text(legacy, encoding="utf-8")
        report = checker.check(note)
        self.assertFalse(report["checks"]["required_h2_present"])
        self.assertIn("1. 主体正文：按 Blog 方式重构源材料内容", report["missing_h2"])

    def test_rejects_legacy_core_concepts_section(self) -> None:
        legacy = """# 视频标题：测试

## 0. 观点卡片

**核心主张**：表达训练要服务听众理解。

## 1. 背景与问题：为什么这个话题值得讨论

旧结构还保留独立术语表。

## 2. 核心概念与术语

| 概念 / 术语 | 视频中的含义 | 为什么重要 | 备注 |
| --- | --- | --- | --- |
| 认知负荷 | 听众处理信息的压力 | 决定表达边界 | 无 |

## 3. 全文结构图：这期视频的论证地图

```mermaid
flowchart LR
  A --> B
```

## 4. 主体正文：按 Blog 方式重构视频内容

### 4.1 旧结构主体

正文。

## 5. 可迁移的判断框架 / 行动框架

1. 方法。

## 6. 总结：最值得带走的 3-5 个结论

1. **含义**：总结。**为什么重要**：重要。**如何使用**：使用。
"""
        tmpdir = Path(tempfile.mkdtemp(prefix="deepnote-checker-test-"))
        note = tmpdir / "legacy_deep_note.md"
        note.write_text(legacy, encoding="utf-8")
        report = checker.check(note)
        self.assertFalse(report["checks"]["required_h2_present"])
        self.assertIn("1. 主体正文：按 Blog 方式重构源材料内容", report["missing_h2"])

    def test_rejects_extra_removed_sections_even_if_required_h2_exist(self) -> None:
        note_text = """# 视频标题：测试

## 1. 主体正文：按 Blog 方式重构视频内容

### 3.1 主体

正文。

## 2. 判断框架与结论

1. 方法。

## 核心概念与术语

这个独立章节不应该再出现。
"""
        tmpdir = Path(tempfile.mkdtemp(prefix="deepnote-checker-test-"))
        note = tmpdir / "extra_removed_section.md"
        note.write_text(note_text, encoding="utf-8")
        report = checker.check(note)
        self.assertFalse(report["checks"]["no_removed_standalone_sections"])
        self.assertFalse(report["passed"])

    def test_rejects_video_manifest_without_keyframes_or_real_skip_evidence(self) -> None:
        note = write_note(
            """### 3.1 提问能力决定回答质量

一个好问题会把背景、目标、约束和评价标准交代清楚。AI 的回答质量不是孤立出现的，它取决于提问者有没有把判断任务切成模型可以处理的结构。

| 提问要素 | 作用 |
| --- | --- |
| 背景 | 限定语境 |
| 目标 | 限定输出方向 |
"""
        )
        manifest = write_manifest(
            {
                "source": {
                    "platform": "bilibili",
                    "source_url": "https://www.bilibili.com/video/BVTEST",
                    "video_available": False,
                },
                "selected_keyframes": [],
                "generated_diagrams": [],
                "tables": [],
                "quality_checks": {
                    "notes": ["no_selected_keyframes_available_or_no_local_video_stream"]
                },
            }
        )
        report = checker.check(note, manifest)
        self.assertFalse(report["checks"]["keyframes_selected_or_absence_documented"])
        self.assertFalse(report["passed"])

    def test_allows_video_manifest_with_selected_keyframes(self) -> None:
        note = write_note(
            """### 3.1 提问能力决定回答质量

一个好问题会把背景、目标、约束和评价标准交代清楚。AI 的回答质量不是孤立出现的，它取决于提问者有没有把判断任务切成模型可以处理的结构。

【关键帧：kf-001，caption=示例场景，source_time=00:01:00，reason=保留原始讲解语境】
"""
        )
        manifest = write_manifest(
            {
                "source": {
                    "platform": "bilibili",
                    "source_url": "https://www.bilibili.com/video/BVTEST",
                    "video_available": True,
                },
                "selected_keyframes": [
                    {
                        "id": "kf-001",
                        "path": "assets/keyframes/kf-001.jpg",
                        "insert": True,
                        "caption": "示例场景",
                    }
                ],
                "generated_diagrams": [],
                "tables": [],
            }
        )
        report = checker.check(note, manifest)
        self.assertTrue(report["checks"]["keyframes_selected_or_absence_documented"])
        self.assertTrue(report["passed"])

    def test_allows_no_keyframes_only_with_real_acquisition_failure(self) -> None:
        note = write_note(
            """### 3.1 提问能力决定回答质量

一个好问题会把背景、目标、约束和评价标准交代清楚。AI 的回答质量不是孤立出现的，它取决于提问者有没有把判断任务切成模型可以处理的结构。

| 提问要素 | 作用 |
| --- | --- |
| 背景 | 限定语境 |
| 目标 | 限定输出方向 |
"""
        )
        manifest = write_manifest(
            {
                "source": {
                    "platform": "bilibili",
                    "source_url": "https://www.bilibili.com/video/BVTEST",
                    "video_available": False,
                    "video_download_attempted": True,
                    "video_download_error": "403 login required",
                },
                "selected_keyframes": [],
                "generated_diagrams": [],
                "tables": [],
                "quality_checks": {
                    "notes": ["download_failed: login required"]
                },
            }
        )
        report = checker.check(note, manifest)
        self.assertTrue(report["checks"]["keyframes_selected_or_absence_documented"])
        self.assertTrue(report["passed"])

    def test_rejects_medium_long_video_with_only_decorative_keyframe(self) -> None:
        note = write_note(
            """### 3.1 成本不是口号，而是现金流边界

创业判断首先要回到现金流。一个方案能不能成立，不取决于叙事有多热闹，而取决于它在最差月份是否还能支付固定成本、获客成本和试错成本。

【关键帧：kf-001，caption=讲者口播画面，source_time=00:03:20，reason=避免页面太单调，增加一点画面氛围】
"""
        )
        manifest = write_manifest(
            {
                "source": {
                    "platform": "bilibili",
                    "source_url": "https://www.bilibili.com/video/BVTEST",
                    "duration_seconds": 1800,
                    "video_available": True,
                },
                "selected_keyframes": [
                    {
                        "id": "kf-001",
                        "path": "assets/keyframes/kf-001.jpg",
                        "insert": True,
                        "caption": "讲者口播画面",
                        "reason": "避免页面太单调，增加一点画面氛围",
                    }
                ],
                "generated_diagrams": [],
                "tables": [],
            }
        )
        report = checker.check(note, manifest)
        self.assertFalse(report["checks"]["asset_selection_policy_followed"])
        self.assertFalse(report["checks"]["keyframes_not_used_as_decoration"])
        self.assertFalse(report["passed"])

    def test_allows_medium_long_video_with_distinct_asset_roles(self) -> None:
        note = write_note(
            """### 3.1 成本判断要同时看固定成本、获客成本和试错周期

创业判断首先要回到现金流。一个方案能不能成立，不取决于叙事有多热闹，而取决于它在最差月份是否还能支付固定成本、获客成本和试错成本。

| 成本对象 | 主要风险 | 判断动作 |
| --- | --- | --- |
| 固定成本 | 现金流被锁死 | 先算生存月数 |
| 获客成本 | 增长越快亏损越快 | 先验证复购 |

```mermaid
flowchart LR
  A[现金流边界] --> B[固定成本]
  A --> C[获客成本]
  A --> D[试错周期]
  B --> E[先活下来]
  C --> F[验证复购]
  D --> G[缩短反馈]
```

【关键帧：kf-001，caption=讲者展示成本拆分表，source_time=00:03:20，reason=保留原视频中的成本拆分证据，避免读者只看到重构后的抽象框架】
"""
        )
        manifest = write_manifest(
            {
                "source": {
                    "platform": "bilibili",
                    "source_url": "https://www.bilibili.com/video/BVTEST",
                    "duration_seconds": 1800,
                    "video_available": True,
                },
                "selected_keyframes": [
                    {
                        "id": "kf-001",
                        "path": "assets/keyframes/kf-001.jpg",
                        "insert": True,
                        "caption": "讲者展示成本拆分表",
                        "reason": "保留原视频中的成本拆分证据",
                    }
                ],
                "generated_diagrams": [],
                "tables": [],
            }
        )
        report = checker.check(note, manifest)
        self.assertTrue(report["checks"]["asset_selection_policy_followed"])
        self.assertTrue(report["checks"]["keyframes_not_used_as_decoration"])
        self.assertTrue(report["passed"])


if __name__ == "__main__":
    unittest.main()
