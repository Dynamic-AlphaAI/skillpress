import matter from "gray-matter";

/** Quote a reviewed one-line description whose literal colon-space breaks YAML. */
export function quoteSkillDescription(markdown, location) {
  const original = markdown.toString("utf8");
  const header = /^(---\r?\nname: [a-z0-9_-]+\r?\ndescription: )([A-Za-z][^\r\n]*: [^\r\n]+)(?=\r?\n---(?:\r?\n|$))/;
  if (!header.test(original)) throw new Error("Unexpected skill metadata in " + location);
  return Buffer.from(original.replace(header, (_, prefix, value) => prefix + JSON.stringify(value)));
}

/** Parse publisher content as data; gray-matter also has executable engines. */
export function parseSkill(/** @type {string} */ file, /** @type {string} */ location) {
  if (!/^---\r?\n/.test(file)) throw new Error(`Expected YAML frontmatter in ${location}`);
  const rejectExecutable = () => { throw new Error(`Executable frontmatter is forbidden in ${location}`); };
  return matter(file, { engines: { javascript: rejectExecutable, js: rejectExecutable } });
}
