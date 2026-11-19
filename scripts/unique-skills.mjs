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

/** Collapse reprints within one author's catalogue, including aliases across their repositories. */
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
    const author = s.author.trim().normalize("NFKC").toLowerCase();
    if (!seen.has(author)) seen.set(author, new Map());
    const editions = seen.get(author);
    for (const key of [`folder:${s.slug}`, `name:${s.identity.name}`, `text:${s.identity.body}`]) {
      if (editions.has(key)) {
        const a = root(i), b = root(editions.get(key));
        parent[Math.max(a, b)] = Math.min(a, b);
      } else editions.set(key, i);
    }
  });
  return skills.filter((_, i) => root(i) === i);
}

/** Existing edition URLs take priority. The installable folder inside each zip keeps its upstream name. */
export function assignEditionIds(skills, previousBooks) {
  const previous = new Map(previousBooks.map(b => [`${b.source}/${b.slug}`, b.id]));
  const reserved = new Set(previous.values());
  const slugs = new Set(skills.map(s => s.slug));
  return skills.map(s => {
    let id = previous.get(`${s.source}/${s.slug}`);
    if (!id) {
      id = s.slug;
      if (reserved.has(id)) {
        const qualified = `${s.slug}--${s.source}`;
        id = qualified;
        for (let n = 2; reserved.has(id) || slugs.has(id); n++) id = `${qualified}-${n}`;
      }
    }
    reserved.add(id);
    return { ...s, id };
  });
}
