#!/usr/bin/env node
/**
 * Imports every skill from github.com/anthropics/skills into ./content, and packages
 * downloads into ./public/downloads.
 *
 *   npm run import                    # all skills
 *   npm run import -- --count 10      # only the 10 most installed
 *   npm run import -- --src /path/to/local/clone
 *
 * Popularity comes from install counts on the skills.sh leaderboard; skills it doesn't
 * list yet are kept and shelved after the ranked ones.
 *
 * content/skills/<slug>/SKILL.md     the text each book is typeset from
 * public/downloads/<slug>.zip        the whole skill folder (scripts, references, assets)
 * public/downloads/<slug>/SKILL.md   the instructions on their own
 * public/downloads/anthropic-skills.zip   every skill, one folder each
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const REPO = "anthropics/skills";
const REPO_URL = `https://github.com/${REPO}`;
const LEADERBOARD_URL = "https://skills.sh";
const ALL_ZIP = "anthropic-skills.zip";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "content");
const downloadsDir = join(root, "public", "downloads");
const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
};
const count = argValue("--count") ? Number(argValue("--count")) : Infinity;

async function fetchInstalls() {
  try {
    const res = await fetch(LEADERBOARD_URL, { headers: { "user-agent": "skillpress-importer" } });
    if (!res.ok) throw new Error(`skills.sh responded ${res.status}`);
    const html = await res.text();
    // The leaderboard is embedded in the page as escaped JSON records.
    const pattern =
      /\\"source\\":\\"([^\\]+)\\",\\"skillId\\":\\"([^\\]+)\\",\\"name\\":\\"[^\\]+\\",\\"installs\\":(\d+)/g;
    const installs = new Map();
    for (const [, source, skillId, n] of html.matchAll(pattern)) {
      if (source === REPO) installs.set(skillId, Math.max(installs.get(skillId) ?? 0, Number(n)));
    }
    return installs;
  } catch (err) {
    console.warn(`  Could not read install counts (${err.message}); keeping alphabetical order.`);
    return new Map();
  }
}

/** Every file under `dir`, skipping VCS and OS clutter. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === ".DS_Store" || name === "__pycache__") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Zip entries for a skill folder, stored under `prefix/` so it unzips as one folder. */
function zipEntries(skillDir, prefix) {
  const entries = {};
  const files = walk(skillDir);
  for (const file of files) {
    const rel = relative(skillDir, file).split(sep).join("/");
    entries[`${prefix}/${rel}`] = [readFileSync(file), { mtime: new Date("2026-01-01T00:00:00Z") }];
  }
  return { entries, files: files.length };
}

function pluginMap(src) {
  const map = new Map();
  let marketplace = null;
  const file = join(src, ".claude-plugin", "marketplace.json");
  if (!existsSync(file)) return { map, marketplace };
  const json = JSON.parse(readFileSync(file, "utf8"));
  marketplace = json.name ?? null;
  for (const plugin of json.plugins ?? []) {
    for (const path of plugin.skills ?? []) {
      const slug = path.split("/").filter(Boolean).pop();
      map.set(slug, { name: plugin.name, skills: (plugin.skills ?? []).map((p) => p.split("/").filter(Boolean).pop()) });
    }
  }
  return { map, marketplace };
}

function licenseOf(dir) {
  const file = join(dir, "LICENSE.txt");
  if (!existsSync(file)) return "Unspecified";
  const text = readFileSync(file, "utf8");
  if (/Apache License/.test(text)) return "Apache-2.0";
  if (/MIT License/.test(text)) return "MIT";
  return "See LICENSE.txt";
}

async function main() {
  let src = argValue("--src");
  let cleanup = null;
  if (!src) {
    src = mkdtempSync(join(tmpdir(), "skillpress-"));
    cleanup = src;
    console.log(`Cloning ${REPO_URL} …`);
    execFileSync("git", ["clone", "--depth", "1", "-q", `${REPO_URL}.git`, src], { stdio: "inherit" });
  }
  const commit = execFileSync("git", ["-C", src, "rev-parse", "HEAD"]).toString().trim();
  const commitDate = execFileSync("git", ["-C", src, "log", "-1", "--format=%cs"]).toString().trim();

  console.log(`Reading install counts from ${LEADERBOARD_URL} …`);
  const installs = await fetchInstalls();
  const { map: plugins, marketplace } = pluginMap(src);

  const slugs = readdirSync(join(src, "skills")).filter((s) => existsSync(join(src, "skills", s, "SKILL.md")));
  const ordered = slugs
    .map((slug) => ({ slug, installs: installs.get(slug) ?? null }))
    .sort((a, b) => (b.installs ?? -1) - (a.installs ?? -1) || a.slug.localeCompare(b.slug))
    .slice(0, count);

  rmSync(join(contentDir, "skills"), { recursive: true, force: true });
  rmSync(downloadsDir, { recursive: true, force: true });
  mkdirSync(join(contentDir, "skills"), { recursive: true });
  mkdirSync(downloadsDir, { recursive: true });

  const everything = {};
  const books = ordered.map(({ slug, installs: n }, i) => {
    const from = join(src, "skills", slug);
    const to = join(contentDir, "skills", slug);
    mkdirSync(to, { recursive: true });
    cpSync(join(from, "SKILL.md"), join(to, "SKILL.md"));
    if (existsSync(join(from, "LICENSE.txt"))) cpSync(join(from, "LICENSE.txt"), join(to, "LICENSE.txt"));

    const { entries, files } = zipEntries(from, slug);
    const zip = zipSync(entries, { level: 9 });
    writeFileSync(join(downloadsDir, `${slug}.zip`), zip);
    mkdirSync(join(downloadsDir, slug), { recursive: true });
    cpSync(join(from, "SKILL.md"), join(downloadsDir, slug, "SKILL.md"));
    for (const [path, value] of Object.entries(entries)) everything[`anthropic-skills/${path}`] = value;

    const plugin = plugins.get(slug) ?? null;
    console.log(
      `  #${String(i + 1).padStart(2)}  ${slug.padEnd(24)} ${(n === null ? "unranked" : `${n.toLocaleString()} installs`).padEnd(20)} ${String(files).padStart(3)} files  ${(zip.length / 1024).toFixed(0)} KB`,
    );
    return {
      slug,
      rank: i + 1,
      installs: n,
      license: licenseOf(from),
      plugin,
      download: { zip: `/downloads/${slug}.zip`, skillMd: `/downloads/${slug}/SKILL.md`, bytes: zip.length, files },
    };
  });

  const all = zipSync(everything, { level: 9 });
  writeFileSync(join(downloadsDir, ALL_ZIP), all);

  const catalog = {
    source: { repo: REPO, url: REPO_URL, commit, commitDate, marketplace },
    ranking: { source: LEADERBOARD_URL, metric: "installs", fetchedAt: new Date().toISOString() },
    allDownload: { zip: `/downloads/${ALL_ZIP}`, bytes: all.length },
    books,
  };
  writeFileSync(join(contentDir, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  if (cleanup) rmSync(cleanup, { recursive: true, force: true });
  console.log(
    `Wrote ${books.length} skills to content/ and public/downloads/ (all-in-one ${(all.length / 1024 / 1024).toFixed(1)} MB, commit ${commit.slice(0, 7)}).`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
