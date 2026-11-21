import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { unzipSync } from "fflate";
import { parseSkill } from "./parse-skill.mjs";
import { pointsToRootMIT, reviewedFileAllowed, reviewedReadingFiles, validSkillPath } from "./source-files.mjs";
import { parseState, serializeState } from "../src/lib/browseState.ts";
import { categories } from "../src/lib/categories.ts";
import { categoryFor } from "../src/lib/classifyTopic.ts";
import { collectionCredit, inCollection, platforms, providerNote, scopeLibrary } from "../src/lib/platforms.ts";
import { canWalk, doorHalfWidth, hallHalfWidth, ladderRuns, roomAt, walk } from "../src/lib/roomFloor.ts";
import { groundRows } from "../src/lib/roomLadder.ts";
import { planRooms } from "../src/lib/roomShelves.ts";

const catalog = JSON.parse(readFileSync("content/catalog.json"));
const { sources } = JSON.parse(readFileSync("sources.json"));
const books = catalog.books.map(book => {
  const publisher = catalog.sources.find(s => s.id === book.source);
  const source = book.credit ? { ...publisher, ...book.credit } : publisher;
  const { data } = parseSkill(readFileSync(`content/skills/${book.id}/SKILL.md`, "utf8"), book.id);
  return { ...book, source, category: book.topic ?? categoryFor(source.repo, book.slug, data.description),
    platforms: [...new Set([...source.platforms, ...(book.platforms ?? [])])], covers: book.covers ?? [] };
});
const library = { books, sources: catalog.sources, authors: [...new Set(books.map(b => b.source.authorId))].map(id => ({ id })) };
const bookById = id => books.find(b => b.id === id);
const expanded = sources.filter(s => s.topics);

test("each reviewed repository contributes licensed, attributed editions with the original instructions in every download", () => {
  assert.ok(expanded.length >= 20);
  assert.equal(new Set(sources.map(s => s.repo.toLowerCase())).size, sources.length);
  assert.equal(new Set(books.map(b => b.id)).size, books.length);
  const all = unzipSync(readFileSync("public" + catalog.allDownload.zip));
  for (const source of expanded) {
    const imported = catalog.sources.find(s => s.id === source.id);
    assert.equal(imported.commit, source.revision);
    assert.match(imported.commit, /^[0-9a-f]{40}$/);
    const bundle = unzipSync(readFileSync("public" + imported.download.zip));
    const editions = books.filter(b => b.source.id === source.id);
    assert.ok(editions.length, source.repo);
    assert.deepEqual(editions.map(b => b.sourcePath).sort(), [...source.skillPaths].sort());
    for (const b of editions) {
      assert.ok(categories.some(c => c.id === b.category && c.id !== "unfiled"));
      assert.equal(b.category, source.topics[b.sourcePath]);
      const zip = unzipSync(readFileSync("public" + b.download.zip));
      assert.equal(Object.keys(zip).length, b.download.files);
      const doc = readFileSync(`content/skills/${b.id}/SKILL.md`);
      const license = readFileSync(`content/skills/${b.id}/LICENSE.txt`);
      assert.ok(Object.entries(zip).some(([name, bytes]) => /\/LICENSE(?:\.txt|\.md)?$/i.test(name) && license.equals(bytes)));
      const standalone = readFileSync("public" + b.download.skillMd);
      if (source.readingFiles || source.standaloneNotice) {
        assert.ok(standalone.subarray(0, doc.length).equals(doc));
        const attribution = standalone.subarray(doc.length).toString();
        assert.ok(attribution.includes(source.author) && attribution.includes(imported.commit) && attribution.includes(license.toString().trim()));
      } else assert.ok(doc.equals(standalone));
      if (source.readingFiles) {
        assert.ok(imported.readingEdition);
        const selected = source.readingFiles[b.sourcePath].map(path =>
          b.slug + "/" + (path.startsWith(b.sourcePath + "/") ? path.slice(b.sourcePath.length + 1) : path));
        assert.deepEqual(Object.keys(zip).filter(name => !/\/(?:LICENSE|NOTICE)$/.test(name)).sort(), selected.sort());
      }
      assert.ok(doc.equals(zip[b.slug + "/SKILL.md"]));
      for (const [name, bytes] of Object.entries(zip)) {
        const buf = Buffer.from(bytes);
        assert.ok(buf.equals(bundle[`${source.id}-skills/${name}`]));
        assert.ok(buf.equals(all[`skillpress/${source.id}/${name}`]));
        const rel = name.slice(b.slug.length + 1);
        if (/\.md$|^(LICENSE|NOTICE)(\.txt)?$/i.test(rel)) continue;
        const hash = createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
        const path = b.sourcePath + "/" + rel;
        assert.equal(source.reviewedAssets?.[path] ?? source.reviewedScripts?.[path], hash);
      }
    }
  }
});

test("reviewed folder and Git object rules reject traversal, scripts, linked files and unreviewed metadata", () => {
  for (const p of [".claude/skills/growth-lead", ".agents/skills/example", "skills/.curated/define-goal", ".github/plugins/azure-cost"]) assert.ok(validSkillPath(p));
  for (const p of [".claude/hooks/run", "folder/.claude/skills/private", "../elsewhere", "/root", "a//b", "a/./b", "x/../../y", ".git/config", "a\\b"]) assert.equal(validSkillPath(p), false);
  const folder = "skills/book", hash = "a".repeat(40);
  const record = (mode, name) => `${mode} blob ${hash}\t${folder}/${name}`;
  assert.ok(reviewedFileAllowed(record("100644", "references/a.md"), folder));
  for (const [mode, name] of [["100755","script.md"],["120000","link.md"],["100644","run.sh"],["100644","agents/openai.yaml"]]) {
    assert.equal(reviewedFileAllowed(record(mode, name), folder), false);
  }
  assert.ok(reviewedFileAllowed(record("100644", "agents/openai.yaml"), folder, { [folder + "/agents/openai.yaml"]: hash }));
  const script = "scripts/pr-wait", approved = { [folder + "/" + script]: hash };
  assert.ok(reviewedFileAllowed(record("100755", script), folder, {}, approved));
  for (const mode of ["100644", "120000"]) assert.equal(reviewedFileAllowed(record(mode, script), folder, {}, approved), false);
  assert.equal(reviewedFileAllowed(record("100755", script), folder, approved), false);
  assert.equal(reviewedFileAllowed(record("100755", script).replace(hash, "b".repeat(40)), folder, {}, approved), false);
});

test("reading selections require every file to be regular Markdown in the pinned tree", () => {
  const folder = "agent-os/skill", base = folder + "/SKILL.md", guide = "docs/Guide.md";
  const record = (path, mode = "100644") => mode + " blob " + "f".repeat(40) + "\t" + path;
  const files = [base, guide];
  assert.doesNotThrow(() => reviewedReadingFiles(folder, files, files.map(p => record(p))));
  const hidden = ".agents/skills/launch-video", markdown = hidden + "/SKILL.md";
  assert.doesNotThrow(() => reviewedReadingFiles(hidden, [markdown], [record(markdown)]));
  for (const path of [hidden + "/../elsewhere.md", hidden + "/.private.md", ".agents/other.md"]) {
    assert.throws(() => reviewedReadingFiles(hidden, [markdown, path], [record(markdown), record(path)]));
  }
  for (const path of ["../leak.md", ".git/config.md", "docs/../guide.md", "scripts/tool.sh", "docs/linked.md", "docs/missing.md"]) {
    const records = [record(base)];
    if (!path.includes("missing")) records.push(record(path, path.includes("linked") ? "120000" : "100644"));
    assert.throws(() => reviewedReadingFiles(folder, [base, path], records));
  }
  assert.throws(() => reviewedReadingFiles(folder, files, [record(base), record(guide, "100755")]));
  assert.throws(() => reviewedReadingFiles(folder, [guide], [record(guide)]));
});

test("platform browsing separates publisher, documented host, and subject; all counts are distinct editions", () => {
  const ids = new Set(platforms.map(p => p.id));
  for (const b of books) for (const id of [...b.platforms, ...b.covers]) assert.ok(ids.has(id));
  const bridge = bookById("grok-run-output"), submission = bookById("chatgpt-app-submission");
  assert.deepEqual(bridge.platforms, ["claude"]);
  assert.equal(collectionCredit(bridge, "grok"), "xAI · Covers Grok");
  assert.ok(inCollection(bridge, "claude"));
  assert.equal(collectionCredit(submission, "chatgpt"), "OpenAI · Covers ChatGPT");
  assert.equal(inCollection(bookById("define-goal"), "chatgpt"), false);
  assert.ok(bookById("mongodb-schema-design").platforms.includes("grok"));
  for (const { id } of platforms) {
    const scoped = scopeLibrary(library, id);
    assert.ok(scoped.books.length);
    assert.equal(scoped.authors.reduce((n, a) => n + a.count, 0), scoped.books.length);
    assert.equal(new Set(scoped.books.map(b => b.id)).size, scoped.books.length);
  }
});

test("shared collections, search, walkthrough, details and reader URLs round-trip and respect conflicting filters", () => {
  for (const search of ["?platform=deepseek&walk", "?platform=chatgpt&q=stripe", "?platform=grok&book=grok-run-output&read&page=3",
    "?view=featured&platform=claude&author=anthropic", "?platform=codex&book=define-goal&details"]) {
    const state = parseState(search, library);
    assert.deepEqual(parseState(serializeState(state, library).toString(), library), state);
  }
  assert.equal(parseState("?platform=claude", library).view, "library");
  assert.equal(parseState("?platform=unknown", library).platform, "all");
  const invalid = parseState("?platform=deepseek&author=openai&book=define-goal&read", library);
  assert.deepEqual([invalid.author, invalid.book, invalid.reading], ["all", null, false]);
  assert.equal(parseState("?book=define-goal&read", library).book, "define-goal");
});

test("provider notes distinguish a publisher's intended host, compatibility and subject matter", () => {
  for (const source of catalog.sources.filter(s => s.primaryPlatform)) {
    assert.ok(source.platforms.includes(source.primaryPlatform), source.repo);
  }
  assert.equal(providerNote(bookById("slidev")), "Built for Claude");
  const bridge = bookById("grok-run-output");
  assert.ok(bridge.covers.includes("grok"));
  assert.equal(providerNote(bridge), "Works with Claude");
  assert.equal(providerNote(bookById("improve-ui")), "Works with Codex, ChatGPT");
  assert.equal(providerNote(bookById("component-canvas")), null);
});

test("the hall draws from across each topic and keeps small collections together", () => {
  const sample = Array.from({ length: 20 }, (_, i) => ({ ...books[0], id: String(i) }));
  const [hall, wing] = planRooms(sample);
  const volumes = room => room.shelves.flatMap(shelf => shelf.books);
  assert.deepEqual(volumes(hall), sample.filter((_, i) => i % 4 !== 3));
  assert.deepEqual(volumes(wing), sample.filter((_, i) => i % 4 === 3));
  assert.equal(planRooms(sample.slice(0, 12)).length, 1);
  assert.ok(hall.shelves.every(shelf => shelf.books.length <= 5));
  const main = volumes(planRooms(books)[0]);
  assert.ok(main.length >= books.length * 0.75);
  for (const id of ["pm-skills", "dbt-skills", "ui-skills"]) assert.ok(main.some(b => b.source.id === id), id);
});

test("both main hall walls have stocked cases in every span from the entrance past the last doorway", () => {
  const [hall, ...wings] = planRooms(books);
  const bays = hall.floor.bays.map((bay, i) => ({ ...bay, stack: hall.stacks[i] }));
  const onRails = new Set(ladderRuns(bays).flat());
  for (const side of [-1, 1]) {
    const doors = wings.map(room => room.floor).filter(floor => floor.side === side).map(floor => floor.doorZ).sort((a, b) => a - b);
    const wall = bays.filter(bay => bay.yaw === -side * Math.PI / 2);
    const ends = [hall.floor.minZ, ...doors, hall.floor.maxZ];
    for (let i = 1; i < ends.length; i++) {
      const here = wall.filter(bay => bay.z > ends[i - 1] && bay.z < ends[i]).sort((a, b) => a.z - b.z);
      assert.ok(here.length >= (i === 1 || i === ends.length - 1 ? 1 : 2), `Empty wall space on side ${side}, span ${i}`);
      for (const [j, bay] of here.entries()) {
        assert.ok(doors.every(z => Math.abs(z - bay.z) >= doorHalfWidth + 1.9 + 0.18));
        if (j) assert.ok(bay.z - here[j - 1].z >= 3.8);
      }
    }
    assert.ok(wall.some(bay => bay.stack.length <= groundRows));
    assert.ok(wall.some(bay => bay.stack.length > groundRows));
  }
  for (const bay of bays) {
    assert.ok(bay.stack.length > 0 && bay.stack.every(row => row.books.length));
    assert.equal(onRails.has(bay), bay.stack.length > groundRows);
    assert.deepEqual(bay.stack.map(row => !!row.upper), bay.stack.map((_, i) => i >= groundRows));
  }
});

test("the full building and each platform floor shelve every book once and have reachable rooms", () => {
  for (const id of ["all", ...platforms.map(p => p.id)]) {
    const scope = scopeLibrary(library, id);
    const rooms = planRooms(scope.books);
    if (id === "all") assert.ok(rooms.length >= 11);
    const shelved = rooms.flatMap(r => r.stacks.flat(2).flatMap(s => s.books.map(b => b.id)));
    assert.deepEqual(shelved.sort(), scope.books.map(b => b.id).sort());
    const floors = rooms.map(room => room.floor);
    for (const [index, room] of rooms.entries()) {
      assert.ok(room.shelves.every(s => s.books.length > 0));
      const floor = floors[index];
      assert.equal(floor.bays.length, room.stacks.length);
      assert.ok(canWalk(floors, floor.entry.x, floor.entry.z));
      if (!index) continue;
      const pos = { x: 0, z: floor.doorZ };
      walk(floors, pos, floor.side * (hallHalfWidth + 2), 0);
      assert.equal(roomAt(floors, pos.x, pos.z), index);
    }
  }
});

test("install guidance follows the actual host and accounts for the internal Grok bridge", async () => {
  const { installMethods } = await import("../src/lib/install.ts");
  const methods = id => installMethods(bookById(id));
  assert.deepEqual(methods("grok-run-output").map(m => m.id), ["upstream"]);
  assert.equal(methods("grok-run-output")[0].copy, undefined);
  assert.ok(methods("office-docx").find(m => m.id === "deepseek").link.href.includes(bookById("office-docx").source.commit));
  assert.equal(methods("stripe-best-practices").find(m => m.id === "chatgpt").link.href, "https://chatgpt.com/plugins/stripe");
  assert.ok(!methods("chatgpt-app-submission").some(m => m.id === "chatgpt"));
});

test("SEO accessions keep contributor credit, full license terms and independent authors’ editions", () => {
  const published = id => books.filter(b => b.source.id === id);
  assert.deepEqual(published("seo-machine").map(b => b.slug), ["growth-lead"]);
  const brief = published("claude-seo").find(b => b.slug === "seo-content-brief");
  assert.equal(brief.source.author, "puneetindersingh");
  const files = unzipSync(readFileSync("public" + brief.download.zip));
  const notice = Buffer.from(files[brief.slug + "/LICENSE.txt"]).toString();
  assert.ok(pointsToRootMIT(notice, brief.source.repo));
  assert.ok(!pointsToRootMIT(notice, "other/publisher"));
  assert.ok(!pointsToRootMIT(notice + "\nAdditional use restrictions apply.", brief.source.repo));
  assert.match(notice, /Copyright \(c\) 2026 puneetindersingh/);
  assert.match(Buffer.from(files[brief.slug + "/LICENSE"]).toString(), /Permission is hereby granted/);
  const keywordEditions = books.filter(b => b.slug === "keyword-research" && ["open-seo", "ryze-seo"].includes(b.source.id));
  assert.equal(new Set(keywordEditions.map(b => b.id)).size, 2);
  assert.equal(new Set(keywordEditions.map(b => b.source.author)).size, 2);
  assert.ok(published("posthog").every(b => b.sourcePath.startsWith("products/") && b.license === "MIT"));
});

test("Mirza's four editions retain their license, subject, setup guide and original folder identity", async () => {
  const { installMethods } = await import("../src/lib/install.ts");
  const expected = {
    "app-store-compliance": ["mobile-development", "CC-BY-4.0"],
    foundry: ["ai-automation", "MIT"],
    "hetzner-provision": ["cloud-infrastructure", "CC-BY-4.0"],
    "xentral-api": ["software-development", "MIT"],
  };
  const byAuthor = books.filter(b => b.source.authorId === "mirza-iqbal");
  assert.deepEqual(byAuthor.map(b => b.id).sort(), Object.keys(expected).sort());
  for (const b of byAuthor) {
    assert.deepEqual([b.category, b.license], expected[b.id]);
    assert.equal(installMethods(b)[0].link.href, b.source.url + "/tree/" + b.source.commit + "#readme");
  }
  assert.equal(bookById("app-store-compliance").sourcePath, "agent-os/skill");
});

test("Theo’s nine interdependent skills and T3 Code’s four contributor editions have distinct credits and downloads", async () => {
  const { installMethods } = await import("../src/lib/install.ts");
  const stacks = books.filter(b => b.source.authorId === "theo-browne");
  const team = books.filter(b => b.source.authorId === "t3-code");
  assert.equal(stacks.length, 9);
  assert.equal(team.length, 4);
  for (const b of stacks) {
    assert.equal(b.source.copyright, "Theo Browne");
    assert.deepEqual(b.platforms, ["claude", "codex"]);
    assert.equal(installMethods(b)[0].link.href, "/downloads/tstack-skills.zip");
  }
  for (const b of team) {
    assert.equal(b.source.copyright, "T3 Tools Inc.");
    assert.equal(installMethods(b)[0].id, "publisher");
    assert.match(b.sourcePath, /^\.agents\/skills\//);
  }
  assert.equal(bookById("launch-video").category, "design-media");
  assert.equal(bookById("leaving-pr-comments").category, "team-communication");
  assert.match(bookById("full-stop").description, /merge to the developer/);
  const bundle = unzipSync(readFileSync("public/downloads/tstack-skills.zip"));
  assert.ok(bundle["tstack-skills/babysit-pr/scripts/pr-wait"]);
});
