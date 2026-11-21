import { execFileSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

/** Reject links, including linked parent directories, before reading publisher files. */
export function safeSourceFile(repoDir, file) {
  const rel = relative(resolve(repoDir), resolve(file));
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel) ||
      !lstatSync(file).isFile() || realpathSync(file) !== join(realpathSync(repoDir), rel)) {
    throw new Error(`Unsupported source file: ${rel}`);
  }
  return file;
}

/** Metadata and licenses must be committed too, even for a local source checkout. */
export function trackedSourceFile(repoDir, file) {
  safeSourceFile(repoDir, file);
  execFileSync("git", ["-C", repoDir, "ls-files", "--error-unmatch", "--", relative(repoDir, file)], { stdio: "pipe" });
  return file;
}

/** Permit ordinary directory names and the publisher conventions used for hidden skill roots. */
export function validSkillPath(path) {
  if (typeof path !== "string") return false;
  const parts = path.split("/");
  return parts.every((part, i) =>
    (i === 0 && part === ".claude" && parts[1] === "skills" && parts.length >= 3) ||
    /^[a-z0-9][a-z0-9_-]*$/i.test(part) || [".agents", ".github", ".curated"].includes(part));
}

export function reviewedFileAllowed(record, folder, assets = {}) {
  const match = /^100644 blob ([a-f0-9]{40})\t([^\t\r\n]+)$/.exec(record);
  if (!match || !match[2].startsWith(folder + "/")) return false;
  const name = match[2].slice(folder.length + 1);
  if (/\.md$/i.test(name) || /^(?:LICENSE|NOTICE)(?:\.txt)?$/i.test(name)) return true;
  return (name === "agents/openai.yaml" || /^assets\/[a-z\d_.-]+\.png$/i.test(name)) &&
    assets[match[2]] === match[1];
}

/** Some publishers keep the copyright notice in the skill and the full MIT terms at the root. */
export function pointsToRootMIT(text, repo) {
  const [reference, copyright, url, ...extra] = text.trim().split(/\r?\n/).filter(Boolean);
  return reference === "MIT License - see repository root LICENSE file for complete terms." &&
    /^Copyright \(c\) \d{4} [\w .'-]+$/i.test(copyright ?? "") &&
    url?.toLowerCase() === `https://github.com/${repo.toLowerCase()}` && extra.length === 0;
}

/** Explicitly selected Markdown from a pinned tree, including a skill's external reference chapters. */
export function reviewedReadingFiles(folder, files, records) {
  if (!Array.isArray(files) || !files.includes(folder + "/SKILL.md") || new Set(files).size !== files.length) {
    throw new Error("Incomplete or duplicate reading selection for " + folder);
  }
  const regular = new Set(records.filter(line => /^100644 blob [a-f0-9]{40}\t/.test(line)).map(line => line.slice(line.indexOf("\t") + 1)));
  for (const path of files) {
    if (!/^(?:[a-z0-9_-]+\/)*[a-z0-9_-][a-z0-9_.-]*\.md$/i.test(path) || !regular.has(path)) {
      throw new Error("Unreviewed or unsupported reading file: " + path);
    }
  }
}
