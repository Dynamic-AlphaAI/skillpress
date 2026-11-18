import assert from "node:assert/strict";
import test from "node:test";
import { skillIdentity, uniqueSkills } from "./unique-skills.mjs";

const make = (slug, name, text) => ({
  slug,
  identity: skillIdentity(`---\nname: ${name}\ndescription: Example\n---\n# ${slug}\n\n${text}\n`, slug),
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
