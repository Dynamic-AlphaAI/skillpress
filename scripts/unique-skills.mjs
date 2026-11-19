import { createHash } from "node:crypto";
import { parseSkill } from "./parse-skill.mjs";

export function skillIdentity(file, location) {
  const { data, content } = parseSkill(file, location);
  const instructions = content.trim().replace(/^# [^\n]*(?:\n|$)/, "").trim().replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ");
  if (typeof data.name !== "string" || !/^[a-z0-9][a-z0-9:_-]*$/i.test(data.name) ||
      typeof data.description !== "string" || !data.description.trim() || !instructions) {
    throw new Error(`Missing skill name, description, or instructions in ${location}`);
  }
  return {
    license: String(data.license ?? "").trim().toLowerCase(),
    name: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    body: createHash("sha256").update(instructions).digest("hex"),
  };
}

/** Editions connected by a folder id, declared name, or instruction text share the first source's edition. */
export function uniqueSkills(skills) {
  const parent = skills.map((_, i) => i);
  function root(i) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  const seen = new Map();
  skills.forEach((s, i) => {
    for (const key of [`folder:${s.slug}`, `name:${s.identity.name}`, `text:${s.identity.body}`]) {
      if (seen.has(key)) {
        const a = root(i), b = root(seen.get(key));
        parent[Math.max(a, b)] = Math.min(a, b);
      } else seen.set(key, i);
    }
  });
  return skills.filter((_, i) => root(i) === i);
}
