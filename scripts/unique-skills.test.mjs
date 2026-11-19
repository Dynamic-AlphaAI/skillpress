import assert from "node:assert/strict";
import test from "node:test";
import { assignEditionIds, skillIdentity, uniqueSkills } from "./unique-skills.mjs";

const make = (slug, name, text) => ({
  author: "First author",
  slug,
  identity: skillIdentity(`---\nname: ${name}\ndescription: Example\n---\n# ${slug}\n\n${text}\n`, slug),
});

test("independent authors keep editions with identical names and instructions, including their original URLs", () => {
  const first = { ...make("compose", "compose", "First workflow."), source: "publisher-one" };
  const second = { ...first, author: "Second author", source: "publisher-two" };
  const third = { ...first, author: "FIRST AUTHOR", source: "other-repo" };
  assert.deepEqual(uniqueSkills([second, first, third]), [second, first]);
  const natural = { ...first, slug: "compose--publisher-two" };
  const previous = [{ ...first, id: "compose" }];
  const result = assignEditionIds([second, first, natural], previous);
  assert.deepEqual(result.map(s => s.id), ["compose--publisher-two-2", "compose", natural.slug]);
  assert.deepEqual(assignEditionIds([second], result), [result[0]]);
});

test("mirrors, renamed reprints and overlapping identities keep one canonical edition", () => {
  const original = make("compose", "compose", "First workflow.");
  const different = make("new-work", "new-work", "Another workflow.");
  const skills = [
    original, different, make("former-name", "former-name", "Second workflow."),
    make("alias", "compose", "Second workflow."), make("compose", "wrapped", "Wrapped content."),
    make("reprint", "reprint", "First  workflow."),
  ];
  assert.deepEqual(uniqueSkills(skills), [original, different]);
});

test("each edition requires YAML metadata and actual instructions", () => {
  for (const file of ["# Example", "---js\n''\n---\nExample", "---\nname: test\n---\nExample",
    "---\nname: test\ndescription: Example\n---\n# Only a title\n"]) {
    assert.throws(() => skillIdentity(file, "fixture"));
  }
});
