import matter from "gray-matter";

/** Parse publisher content as data; gray-matter also has executable engines. */
export function parseSkill(/** @type {string} */ file, /** @type {string} */ location) {
  if (!/^---\r?\n/.test(file)) throw new Error(`Expected YAML frontmatter in ${location}`);
  const rejectExecutable = () => { throw new Error(`Executable frontmatter is forbidden in ${location}`); };
  return matter(file, { engines: { javascript: rejectExecutable, js: rejectExecutable } });
}
