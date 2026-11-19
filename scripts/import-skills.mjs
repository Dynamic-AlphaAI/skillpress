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
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assignEditionIds, skillIdentity, uniqueSkills } from "./unique-skills.mjs";
import { safeSourceFile, trackedSourceFile, reviewedFileAllowed, validSkillPath } from "./source-files.mjs";
import { zipSync } from "fflate";

const LEADERBOARD_URL = "https://skills.sh";
const ALL_ZIP = "skillpress-all.zip";
// ZIP stores local wall-clock fields. Use the same fields in every importer timezone.
const MTIME = new Date(2026, 0, 1, 12);

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
    if (!installs.size) throw new Error("empty leaderboard");
    return installs;
  } catch (err) {
    console.warn(`  Could not read install counts (${err.message}); keeping the previous ranking snapshot.`);
    return null;
  }
}

/** Only package files committed by the publisher, even when using a local checkout. */
function trackedFiles(skillDir, repoDir) {
  const list = execFileSync("git", ["-C", repoDir, "ls-files", "-z", "--", relative(repoDir, skillDir)]);
  return list.toString().split("\0").filter(Boolean).map((path) => {
    const file = join(repoDir, path);
    return safeSourceFile(repoDir, file);
  });
}

function detectLicense(text) {
  text = text.replace(/\s+/g, " ");
  if (/Apache License/.test(text)) return "Apache-2.0";
  if (/Permission is hereby granted, free of charge/i.test(text) && /deal in the Software without restriction/i.test(text)) return "MIT";
  if (/Redistribution and use in source and binary forms/i.test(text) && /Neither the name/i.test(text) && /THIS SOFTWARE IS PROVIDED/i.test(text)) return "BSD-3-Clause";
  if (/Mozilla Public License Version 2.0/i.test(text)) return "MPL-2.0";
  if (/GNU General Public License/.test(text) && /either version 2 of the License/.test(text)) return "GPL-2.0-or-later";
  return "See LICENSE";
}

/** The skill's own license file, else the repository's. */
function licenseFor(skillDir, repoDir, declared) {
  for (let parent = skillDir; parent !== repoDir; parent = dirname(parent)) {
    for (const name of ["LICENSE.txt", "LICENSE", "LICENSE.md"]) {
      if (!existsSync(join(parent, name))) continue;
      const file = trackedSourceFile(repoDir, join(parent, name));
      return { file, bundled: parent === skillDir, id: detectLicense(readFileSync(file, "utf8")) };
    }
  }
  for (const name of ["LICENSE", "LICENSE.txt", "LICENSE.md"]) {
    const file = join(repoDir, name);
    if (!existsSync(file)) continue;
    trackedSourceFile(repoDir, file);
    const id = detectLicense(readFileSync(file, "utf8"));
    if (declared === "mit" && id !== "MIT") {
      return { file: join(root, "scripts/licenses/MIT.txt"), bundled: false, id: "MIT", repositoryLicense: file };
    }
    return { file, bundled: false, id };
  }
  return { file: null, bundled: false, id: "Unspecified" };
}

/** Zip entries for a skill folder under `prefix/`, adding the repo license when the folder has none. */
function skillEntries(skillDir, repoDir, prefix, license) {
  const entries = {};
  const files = trackedFiles(skillDir, repoDir);
  for (const file of files) {
    entries[`${prefix}/${relative(skillDir, file).split(sep).join("/")}`] = [readFileSync(file), { mtime: MTIME }];
  }
  if (license.file && !license.bundled) entries[`${prefix}/LICENSE`] = [readFileSync(license.file), { mtime: MTIME }];
  for (const name of ["NOTICE", "NOTICE.txt", "THIRD_PARTY_NOTICES.md"]) {
    const notice = join(repoDir, name);
    if (existsSync(notice) && !entries[`${prefix}/${name}`]) {
      entries[`${prefix}/${name}`] = [readFileSync(trackedSourceFile(repoDir, notice)), { mtime: MTIME }];
    }
  }
  if (license.repositoryLicense) entries[`${prefix}/REPOSITORY-LICENSE`] = [readFileSync(license.repositoryLicense), { mtime: MTIME }];
  if (license.id === "GPL-2.0-or-later") entries[`${prefix}/COPYING`] ??= [readFileSync(join(root, "scripts/licenses/GPL-2.0.txt")), { mtime: MTIME }];
  return { entries, files: Object.keys(entries).length };
}

/** Claude Code plugin membership for each skill in a source. */
function pluginsFor(source, repoDir, slugs) {
  const map = new Map();
  if (source.plugin === "marketplace.json") {
    const file = join(repoDir, ".claude-plugin", "marketplace.json");
    if (!existsSync(file)) return map;
    trackedSourceFile(repoDir, file);
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
  if (localSrc[source.id]) return resolve(localSrc[source.id]);
  const dir = mkdtempSync(join(tmpdir(), `skillpress-${source.id}-`));
  cleanup.push(dir);
  console.log(`Cloning ${source.repo} …`);
  const remote = `https://github.com/${source.repo}.git`;
  if (source.revision) {
    execFileSync("git", ["-C", dir, "init", "-q"]);
    const git = (...args) => execFileSync("git", ["-C", dir, ...args]);
    git("remote", "add", "origin", remote);
    if (source.skillPaths) {
      if (!source.skillPaths.every(validSkillPath)) throw new Error(`Invalid skill folder in ${source.repo}`);
      git("config", "remote.origin.promisor", "true");
      git("config", "remote.origin.partialclonefilter", "blob:none");
      git("sparse-checkout", "set", "--cone", "--", ...source.skillPaths);
    }
    git("fetch", "--depth", "1", "-q", ...(source.skillPaths ? ["--filter=blob:none"] : []), "origin", source.revision);
    execFileSync("git", ["-C", dir, "checkout", "-q", "--detach", "FETCH_HEAD"]);
  } else {
    execFileSync("git", ["clone", "--depth", "1", "-q", remote, dir], { stdio: "inherit" });
  }
  return dir;
}

function publishedFolders(source, repoDir) {
  if (source.skillPaths) {
    if (!/^[a-f0-9]{40}$/.test(source.revision ?? "")) throw new Error(`Pin reviewed folders in ${source.repo}`);
    return source.skillPaths.map((sourcePath) => {
      if (!validSkillPath(sourcePath)) throw new Error(`Invalid skill path: ${sourcePath}`);
      const records = execFileSync("git", ["-C", repoDir, "ls-tree", "-rz", "HEAD", "--", sourcePath])
        .toString().split("\0").filter(Boolean);
      if (!records.length || records.some((file) => !reviewedFileAllowed(file, sourcePath, source.reviewedAssets))) {
        throw new Error(`Unexpected file in reviewed folder in ${source.repo}/${sourcePath}`);
      }
      return { slug: sourcePath.split("/").at(-1), sourcePath };
    });
  }
  return [source.path, ...(source.additionalPaths ?? [])].flatMap((path) =>
      readdirSync(join(repoDir, path), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && existsSync(join(repoDir, path, entry.name, "SKILL.md")))
        .map(({ name: slug }) => ({ slug, sourcePath: `${path}/${slug}` }))
        .sort((a, b) => a.slug.localeCompare(b.slug)),
    );
}

async function importLibrary(cleanup) {
  console.log(`Reading install counts from ${LEADERBOARD_URL} …`);
  const catalogPath = join(contentDir, "catalog.json");
  const oldCatalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, "utf8")) : null;
  const previous = oldCatalog?.books ?? [];
  const installs = await fetchInstalls();
  const previousCounts = new Map(previous.map(book => [`${book.source}/${book.slug}`, book.installs]));

  const sourceInfo = [];
  const skills = [];
  for (const source of sources) {
    const repoDir = cloneSource(source, cleanup);
    const commit = execFileSync("git", ["-C", repoDir, "rev-parse", "HEAD"]).toString().trim();
    if (source.revision && commit !== source.revision) throw new Error(`Revision mismatch for ${source.repo}`);
    execFileSync("git", ["-C", repoDir, "diff", "--quiet", "HEAD", "--"]);
    const commitDate = execFileSync("git", ["-C", repoDir, "log", "-1", "--format=%cs"]).toString().trim();
    const folders = publishedFolders(source, repoDir);
    if (!folders.length) throw new Error(`No published skills found in ${source.repo}`);
    const plugins = pluginsFor(source, repoDir, folders.map((f) => f.slug));
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
      platforms: source.platforms ?? [],
      series: source.series ?? null,
      bundleNote: source.bundleNote ?? null,
    });
    for (const { slug, sourcePath } of folders) {
      const dir = join(repoDir, sourcePath);
      execFileSync("git", ["-C", repoDir, "ls-files", "--error-unmatch", "--", `${sourcePath}/SKILL.md`]);
      const identity = skillIdentity(readFileSync(safeSourceFile(repoDir, join(dir, "SKILL.md")), "utf8"), `${source.repo}/${sourcePath}`);
      const license = licenseFor(dir, repoDir, identity.license);
      if (!license.file || license.id === "See LICENSE") {
        if (source.skillPaths) throw new Error(`Review the redistribution license for ${source.repo}/${sourcePath}`);
        console.warn(`  Skipping ${source.repo}/${sourcePath}: redistribution license needs review.`);
        continue;
      }
      skills.push({ platforms: source.editionPlatforms?.[slug], topic: source.topics?.[sourcePath], covers: source.covers?.[slug], slug, sourcePath, identity, license, author: source.author, source: source.id, repoDir, dir, installs: (installs ? installs.get(`${source.repo}/${slug}`) : previousCounts.get(`${source.id}/${slug}`)) ?? null, plugin: plugins.get(slug) ?? null });
    }
  }

  // Ranked first by installs, then the unlisted ones alphabetically.
  const unique = assignEditionIds(uniqueSkills(skills), previous);
  console.log(`Kept ${unique.length} distinct skills from ${skills.length} source folders.`);
  unique.sort((a, b) => (b.installs ?? -1) - (a.installs ?? -1) || a.slug.localeCompare(b.slug));
  const picked = unique.slice(0, count);

  const staging = mkdtempSync(join(root, ".skillpress-import-"));
  cleanup.push(staging);
  const stagedSkills = join(staging, "skills");
  const stagedDownloads = join(staging, "downloads");
  mkdirSync(stagedSkills);
  mkdirSync(stagedDownloads);

  const perSource = Object.fromEntries(sources.map((s) => [s.id, {}]));
  const everything = {};
  const books = picked.map((skill, i) => {
    const id = skill.id;
    const license = skill.license;

    const to = join(stagedSkills, id);
    mkdirSync(to, { recursive: true });
    cpSync(join(skill.dir, "SKILL.md"), join(to, "SKILL.md"));
    if (license.file) cpSync(license.file, join(to, "LICENSE.txt"));

    // The folder inside the zip keeps the skill's own name, which is what agents expect.
    const { entries, files } = skillEntries(skill.dir, skill.repoDir, skill.slug, license);
    const zip = zipSync(entries, { level: 9 });
    writeFileSync(join(stagedDownloads, `${id}.zip`), zip);
    mkdirSync(join(stagedDownloads, id), { recursive: true });
    cpSync(join(skill.dir, "SKILL.md"), join(stagedDownloads, id, "SKILL.md"));
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
      sourcePath: skill.sourcePath,
      source: skill.source,
      ...(skill.platforms && { platforms: skill.platforms }),
      ...(skill.topic && { topic: skill.topic }),
      ...(skill.covers && { covers: skill.covers }),
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
    writeFileSync(join(stagedDownloads, name), zip);
    info.download = { zip: `/downloads/${name}`, bytes: zip.length };
  }
  const all = zipSync(everything, { level: 9 });
  writeFileSync(join(stagedDownloads, ALL_ZIP), all);

  const catalog = {
    sources: sourceInfo,
    ranking: { source: LEADERBOARD_URL, metric: "installs", fetchedAt: (!installs && oldCatalog?.ranking.fetchedAt) || new Date().toISOString() },
    allDownload: { zip: `/downloads/${ALL_ZIP}`, bytes: all.length },
    books,
  };
  writeFileSync(join(staging, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  const outputs = [
    [stagedSkills, join(contentDir, "skills")],
    [stagedDownloads, downloadsDir],
    [join(staging, "catalog.json"), join(contentDir, "catalog.json")],
  ];
  const undo = [];
  try {
    for (const [src, dest] of outputs) {
      if (existsSync(dest)) {
        const backup = src + ".previous";
        renameSync(dest, backup);
        undo.push(() => renameSync(backup, dest));
      }
      renameSync(src, dest);
      undo.push(() => renameSync(dest, src));
    }
  } catch (error) {
    for (const restore of undo.reverse()) restore();
    throw error;
  }
  console.log(`Wrote ${books.length} skills from ${sourceInfo.length} libraries (all-in-one ${(all.length / 1024 / 1024).toFixed(1)} MB).`);
}

const cleanup = [];
importLibrary(cleanup).finally(() => {
  for (const dir of cleanup) rmSync(dir, { recursive: true, force: true });
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
