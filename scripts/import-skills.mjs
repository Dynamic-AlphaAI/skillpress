#!/usr/bin/env node
/**
 * Imports every skill from the libraries listed in sources.json into ./content, and
 * packages downloads into ./public/downloads.
 *
 *   npm run import                    # everything
 *   npm run import -- --count 10      # only the 10 most installed
 *   npm run import -- --src anthropic=/path/to/clone   # use a local clone for a source
 *
 * Popularity comes from install counts on the skills.sh leaderboard; skills it doesn't
 * list yet are kept and shelved after the ranked ones.
 *
 * content/skills/<id>/SKILL.md          the text each book is typeset from (+ LICENSE.txt)
 * public/downloads/<id>.zip             the whole skill folder (scripts, references, assets)
 * public/downloads/<id>/SKILL.md        the instructions on their own
 * public/downloads/<source>-skills.zip  every skill from one library
 * public/downloads/skillpress-all.zip   everything on the shelf
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const LEADERBOARD_URL = "https://skills.sh";
const ALL_ZIP = "skillpress-all.zip";
const MTIME = new Date("2026-01-01T12:00:00Z"); // fixed, so unchanged skills zip byte-for-byte the same

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "content");
const downloadsDir = join(root, "public", "downloads");
const { sources } = JSON.parse(readFileSync(join(root, "sources.json"), "utf8"));

const args = process.argv.slice(2);
const argValues = (flag) => args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));
const count = argValues("--count")[0] ? Number(argValues("--count")[0]) : Infinity;
const localSrc = Object.fromEntries(argValues("--src").map((v) => v.split("=")));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function fetchInstalls() {
  try {
    const res = await fetch(LEADERBOARD_URL, { headers: { "user-agent": "skillpress-importer" } });
    if (!res.ok) throw new Error(`skills.sh responded ${res.status}`);
    const html = await res.text();
    // The leaderboard is embedded in the page as escaped JSON records.
    const pattern =
      /\\"source\\":\\"([^\\]+)\\",\\"skillId\\":\\"([^\\]+)\\",\\"name\\":\\"[^\\]+\\",\\"installs\\":(\d+)/g;
    const installs = new Map();
    for (const [, repo, skillId, n] of html.matchAll(pattern)) {
      const key = `${repo}/${skillId}`;
      installs.set(key, Math.max(installs.get(key) ?? 0, Number(n)));
    }
    return installs;
  } catch (err) {
    console.warn(`  Could not read install counts (${err.message}); shelving alphabetically.`);
    return new Map();
  }
}

/** Every file under `dir`, skipping VCS and OS clutter. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === ".git" || name === ".DS_Store" || name === "__pycache__" || name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function detectLicense(text) {
  if (/Apache License/.test(text)) return "Apache-2.0";
  if (/MIT License|Permission is hereby granted, free of charge/.test(text)) return "MIT";
  return "See LICENSE";
}

/** The skill's own license file, else the repository's. */
function licenseFor(skillDir, repoDir) {
  for (const name of ["LICENSE.txt", "LICENSE", "LICENSE.md"]) {
    if (existsSync(join(skillDir, name))) return { file: join(skillDir, name), bundled: true, id: detectLicense(readFileSync(join(skillDir, name), "utf8")) };
  }
  for (const name of ["LICENSE", "LICENSE.txt", "LICENSE.md"]) {
    if (existsSync(join(repoDir, name))) return { file: join(repoDir, name), bundled: false, id: detectLicense(readFileSync(join(repoDir, name), "utf8")) };
  }
  return { file: null, bundled: false, id: "Unspecified" };
}

/** Zip entries for a skill folder under `prefix/`, adding the repo license when the folder has none. */
function skillEntries(skillDir, prefix, license) {
  const entries = {};
  const files = walk(skillDir);
  for (const file of files) {
    entries[`${prefix}/${relative(skillDir, file).split(sep).join("/")}`] = [readFileSync(file), { mtime: MTIME }];
  }
  if (license.file && !license.bundled) entries[`${prefix}/LICENSE`] = [readFileSync(license.file), { mtime: MTIME }];
  return { entries, files: Object.keys(entries).length };
}

/** Claude Code plugin membership for each skill in a source. */
function pluginsFor(source, repoDir, slugs) {
  const map = new Map();
  if (source.plugin === "marketplace.json") {
    const file = join(repoDir, ".claude-plugin", "marketplace.json");
    if (!existsSync(file)) return map;
    const json = JSON.parse(readFileSync(file, "utf8"));
    for (const plugin of json.plugins ?? []) {
      // A plugin without a skills list ships everything in the repo's skills folder.
      const skills = plugin.skills ? plugin.skills.map((p) => p.split("/").filter(Boolean).pop()) : slugs;
      for (const slug of skills) map.set(slug, { name: plugin.name, marketplace: json.name, addMarketplace: source.repo, skills });
    }
  } else if (source.plugin && typeof source.plugin === "object") {
    for (const slug of slugs) map.set(slug, { ...source.plugin, skills: slugs });
  }
  return map;
}

function cloneSource(source, cleanup) {
  if (localSrc[source.id]) return localSrc[source.id];
  const dir = mkdtempSync(join(tmpdir(), `skillpress-${source.id}-`));
  cleanup.push(dir);
  console.log(`Cloning ${source.repo} …`);
  execFileSync("git", ["clone", "--depth", "1", "-q", `https://github.com/${source.repo}.git`, dir], { stdio: "inherit" });
  return dir;
}

async function main() {
  const cleanup = [];
  console.log(`Reading install counts from ${LEADERBOARD_URL} …`);
  const installs = await fetchInstalls();

  const sourceInfo = [];
  const skills = [];
  for (const source of sources) {
    const repoDir = cloneSource(source, cleanup);
    const commit = execFileSync("git", ["-C", repoDir, "rev-parse", "HEAD"]).toString().trim();
    const commitDate = execFileSync("git", ["-C", repoDir, "log", "-1", "--format=%cs"]).toString().trim();
    const base = join(repoDir, source.path);
    const slugs = readdirSync(base)
      .filter((s) => existsSync(join(base, s, "SKILL.md")))
      .sort();
    const plugins = pluginsFor(source, repoDir, slugs);
    sourceInfo.push({
      id: source.id,
      repo: source.repo,
      url: `https://github.com/${source.repo}`,
      path: source.path,
      commit,
      commitDate,
      author: source.author,
      authorId: slugify(source.author),
      authorUrl: source.authorUrl ?? null,
      copyright: source.copyright ?? source.author,
      series: source.series ?? null,
      bundleNote: source.bundleNote ?? null,
      repoDir,
    });
    for (const slug of slugs) {
      skills.push({ slug, source: source.id, repoDir, dir: join(base, slug), installs: installs.get(`${source.repo}/${slug}`) ?? null, plugin: plugins.get(slug) ?? null });
    }
  }

  // Ranked first by installs, then the unlisted ones alphabetically.
  skills.sort((a, b) => (b.installs ?? -1) - (a.installs ?? -1) || a.slug.localeCompare(b.slug));
  const picked = skills.slice(0, count);

  rmSync(join(contentDir, "skills"), { recursive: true, force: true });
  rmSync(downloadsDir, { recursive: true, force: true });
  mkdirSync(join(contentDir, "skills"), { recursive: true });
  mkdirSync(downloadsDir, { recursive: true });

  const taken = new Set();
  const perSource = Object.fromEntries(sources.map((s) => [s.id, {}]));
  const everything = {};
  const books = picked.map((skill, i) => {
    // Book ids are the skill name, unless two libraries ship the same one.
    const id = taken.has(skill.slug) ? `${skill.source}-${skill.slug}` : skill.slug;
    taken.add(id);
    const license = licenseFor(skill.dir, skill.repoDir);

    const to = join(contentDir, "skills", id);
    mkdirSync(to, { recursive: true });
    cpSync(join(skill.dir, "SKILL.md"), join(to, "SKILL.md"));
    if (license.file) cpSync(license.file, join(to, "LICENSE.txt"));

    // The folder inside the zip keeps the skill's own name, which is what agents expect.
    const { entries, files } = skillEntries(skill.dir, skill.slug, license);
    const zip = zipSync(entries, { level: 9 });
    writeFileSync(join(downloadsDir, `${id}.zip`), zip);
    mkdirSync(join(downloadsDir, id), { recursive: true });
    cpSync(join(skill.dir, "SKILL.md"), join(downloadsDir, id, "SKILL.md"));
    for (const [path, value] of Object.entries(entries)) {
      perSource[skill.source][`${skill.source}-skills/${path}`] = value;
      everything[`skillpress/${skill.source}/${path}`] = value;
    }

    console.log(
      `  #${String(i + 1).padStart(2)}  ${(skill.source + "/" + skill.slug).padEnd(44)} ${(skill.installs === null ? "unranked" : `${skill.installs.toLocaleString()} installs`).padEnd(18)} ${String(files).padStart(3)} files  ${(zip.length / 1024).toFixed(0)} KB`,
    );
    return {
      id,
      slug: skill.slug,
      source: skill.source,
      rank: i + 1,
      installs: skill.installs,
      license: license.id,
      plugin: skill.plugin,
      download: { zip: `/downloads/${id}.zip`, skillMd: `/downloads/${id}/SKILL.md`, bytes: zip.length, files },
    };
  });

  for (const info of sourceInfo) {
    const zip = zipSync(perSource[info.id], { level: 9 });
    const name = `${info.id}-skills.zip`;
    writeFileSync(join(downloadsDir, name), zip);
    info.download = { zip: `/downloads/${name}`, bytes: zip.length };
    delete info.repoDir;
  }
  const all = zipSync(everything, { level: 9 });
  writeFileSync(join(downloadsDir, ALL_ZIP), all);

  const catalog = {
    sources: sourceInfo,
    ranking: { source: LEADERBOARD_URL, metric: "installs", fetchedAt: new Date().toISOString() },
    allDownload: { zip: `/downloads/${ALL_ZIP}`, bytes: all.length },
    books,
  };
  writeFileSync(join(contentDir, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  for (const dir of cleanup) rmSync(dir, { recursive: true, force: true });
  console.log(`Wrote ${books.length} skills from ${sourceInfo.length} libraries (all-in-one ${(all.length / 1024 / 1024).toFixed(1)} MB).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
