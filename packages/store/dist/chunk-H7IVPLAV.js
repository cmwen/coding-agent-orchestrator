// src/utils.ts
import { promises as fs } from "fs";
import path from "path";
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "entry";
}
function normalizeAgentId(value) {
  return slugify(value);
}
function compactTimestamp(timestamp) {
  return timestamp.slice(0, 19).replace(/[^0-9]/g, "");
}
function isoFromCompactTimestamp(compact) {
  if (!/^\d{14}$/.test(compact)) {
    return compact;
  }
  const year = compact.slice(0, 4);
  const month = compact.slice(4, 6);
  const day = compact.slice(6, 8);
  const hour = compact.slice(8, 10);
  const minute = compact.slice(10, 12);
  const second = compact.slice(12, 14);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}
function displayTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 16).replace("T", " ");
}
function firstParagraph(markdown) {
  const cleaned = markdown.replace(/^---[\s\S]*?---\n?/, "").split(/\n\s*\n/).map((block) => block.replace(/^#+\s+/gm, "").trim()).find((block) => block.length > 0);
  return cleaned ?? "No description provided.";
}
function toPosixRelative(root, target) {
  return path.relative(root, target).split(path.sep).join("/");
}
function ensureTrailingNewline(value) {
  return value.endsWith("\n") ? value : `${value}
`;
}
function isNodeError(error) {
  return error instanceof Error && "code" in error;
}
async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
async function readOptionalFile(targetPath) {
  try {
    return await fs.readFile(targetPath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return void 0;
    }
    throw error;
  }
}
async function readDirNames(root) {
  if (!await pathExists(root)) {
    return [];
  }
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((left, right) => left.localeCompare(right));
}
async function walkFiles(root) {
  if (!await pathExists(root)) {
    return [];
  }
  const results = [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const resolvedPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walkFiles(resolvedPath));
      continue;
    }
    if (entry.isFile()) {
      results.push(resolvedPath);
    }
  }
  return results;
}

export {
  slugify,
  normalizeAgentId,
  compactTimestamp,
  isoFromCompactTimestamp,
  displayTimestamp,
  firstParagraph,
  toPosixRelative,
  ensureTrailingNewline,
  pathExists,
  readOptionalFile,
  readDirNames,
  walkFiles
};
