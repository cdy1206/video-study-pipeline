#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

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
  if (!args.plan || !args.output) {
    throw new Error("Usage: assemble_v3_study_model.cjs --plan <v3_editorial_plan.json> --output <v3_study_model.json>");
  }
  return args;
}

function headingLevel(line) {
  const match = String(line).match(/^(#{1,6})\s+/);
  return match ? match[1].length : 0;
}

function extractSection(markdown, heading) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const start = lines.findIndex((line) => line.trim() === heading.trim());
  if (start < 0) throw new Error(`DeepNote heading not found: ${heading}`);
  const level = headingLevel(lines[start]);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const nextLevel = headingLevel(lines[index]);
    if (nextLevel && nextLevel <= level) {
      end = index;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join("\n")
    .replace(/^\s*>\s*时间戳：[^\n]*\n+/m, "")
    .trim();
}

function assemble(args) {
  const planPath = path.resolve(args.plan);
  const outputPath = path.resolve(args.output);
  const planRoot = path.dirname(planPath);
  const outputRoot = path.dirname(outputPath);
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  if (plan.schema_version !== "v3-multimodal-editorial-plan@1") {
    throw new Error("schema_version must be v3-multimodal-editorial-plan@1");
  }
  const deepNotePath = path.resolve(planRoot, plan.deep_note);
  const deepNote = fs.readFileSync(deepNotePath, "utf8");
  const relativeFromOutput = (value) => {
    if (!value || /^(?:data:|https?:|file:)/.test(value)) return value;
    return path.relative(outputRoot, path.resolve(planRoot, value)).split(path.sep).join("/");
  };
  const mapAssetGroup = (group = {}) => Object.fromEntries(
    Object.entries(group).map(([id, item]) => [id, { ...item, src: relativeFromOutput(item.src) }]),
  );
  const model = {
    schema_version: "v3-multimodal-study-model@1",
    metadata: plan.metadata,
    ui: plan.ui || {},
    source: Object.fromEntries(
      Object.entries(plan.source || {}).map(([key, value]) => [key, relativeFromOutput(value)]),
    ),
    hero: plan.hero,
    lead: {
      title: plan.lead?.title,
      body_markdown: plan.lead?.body_markdown || extractSection(deepNote, plan.lead?.heading),
    },
    chapters: plan.chapters.map((chapter) => ({
      ...chapter,
      body_markdown: chapter.body_markdown || extractSection(deepNote, chapter.heading),
    })),
    assets: {
      keyframes: mapAssetGroup(plan.assets?.keyframes),
      diagrams: mapAssetGroup(plan.assets?.diagrams),
      search_suggestions: plan.assets?.search_suggestions || [],
    },
    conclusion_title: plan.conclusion?.title,
    conclusion_markdown: plan.conclusion?.body_markdown || extractSection(deepNote, plan.conclusion?.heading),
  };
  model.chapters.forEach((chapter) => delete chapter.heading);
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(model, null, 2) + "\n");
  process.stdout.write(`${outputPath}\n`);
}

try {
  assemble(parseArgs(process.argv.slice(2)));
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}
