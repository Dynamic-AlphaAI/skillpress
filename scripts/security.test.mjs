import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseSkill } from "./parse-skill.mjs";
import { safeSourceFile, trackedSourceFile } from "./source-files.mjs";

test("publisher frontmatter cannot execute JavaScript or YAML function tags", () => {
  globalThis.skillpressParserExecuted = false;
  try {
    for (const language of ["js", "javascript"]) {
      const malicious = `---${language}\n(globalThis.skillpressParserExecuted = true, {name: "test"})\n---\nInstructions`;
      assert.throws(() => parseSkill(malicious, "fixture"));
      assert.equal(globalThis.skillpressParserExecuted, false);
    }
    assert.throws(() => parseSkill('---\nvalue: !!js/function "function () {}"\n---\nInstructions', "fixture"));
    assert.equal(parseSkill("---\r\nname: safe\r\n---\r\nInstructions", "fixture").data.name, "safe");
  } finally {
    delete globalThis.skillpressParserExecuted;
  }
});

test("publisher files cannot read outside the checkout or follow symlinks", () => {
  const root = mkdtempSync(join(tmpdir(), "skillpress-source-test-"));
  const repo = join(root, "repo");
  mkdirSync(repo);
  try {
    const file = join(repo, "LICENSE");
    const outside = join(root, "private.txt");
    writeFileSync(file, "Publisher license");
    writeFileSync(outside, "Private fixture");
    assert.equal(safeSourceFile(repo, file), file);
    assert.throws(() => safeSourceFile(repo, outside));
    symlinkSync(outside, join(repo, "external-link"));
    symlinkSync(file, join(repo, "internal-link"));
    symlinkSync(root, join(repo, "linked-parent"));
    for (const linked of ["external-link", "internal-link", "linked-parent/private.txt"]) {
      assert.throws(() => safeSourceFile(repo, join(repo, linked)));
    }
    execFileSync("git", ["-C", repo, "init", "-q"]);
    assert.throws(() => trackedSourceFile(repo, file));
    execFileSync("git", ["-C", repo, "add", "LICENSE"]);
    assert.equal(trackedSourceFile(repo, file), file);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("every distributed edition includes an identified license", () => {
  const catalog = JSON.parse(readFileSync(new URL("../content/catalog.json", import.meta.url), "utf8"));
  for (const book of catalog.books) {
    assert.ok(!["Unspecified", "See LICENSE"].includes(book.license), book.id);
    assert.ok(readFileSync(new URL(`../content/skills/${book.id}/LICENSE.txt`, import.meta.url), "utf8").trim(), book.id);
  }
});
