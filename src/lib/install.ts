import type { Book } from "./types";

export interface InstallMethod {
  id: string;
  label: string;
  /** One line on who this is for. */
  note: string;
  /** Where the copied text goes, shown above it. */
  kind?: string;
  /** Copyable text: a prompt or shell/slash commands. Absent for click-through steps. */
  copy?: string;
  steps?: string[];
  link?: { href: string; label: string };
}

/**
 * Ways to install one skill. Commands match the source repo's README and skills.sh;
 * the agent prompt is written so any coding agent can follow it.
 */
export function installMethods(book: Book): InstallMethod[] {
  const { url, repo, path, bundleNote } = book.source;
  const name = book.skillName;
  const dir = `${path}/${book.slug}`;
  const clone = `/tmp/${repo.split("/")[1]}`;
  const methods: InstallMethod[] = [];

  methods.push({
    id: "agent",
    label: "Agent prompt",
    kind: "Prompt",
    note: "Paste this into Claude Code, Codex, Cursor, or any agent that can run commands.",
    copy: [
      `Install the "${name}" Agent Skill by ${book.source.author}, from ${url}.`,
      ``,
      `1. Fetch the whole folder ${dir} — SKILL.md plus every script, reference, and asset beside it, not just SKILL.md. For example:`,
      `   git clone --depth 1 ${url}.git ${clone}`,
      `2. Copy it into your skills directory as a folder named "${name}":`,
      `   - Claude Code: ~/.claude/skills/${name}/ (all projects) or .claude/skills/${name}/ (this project only)`,
      `   - Another agent: the directory you load Agent Skills from (folders containing a SKILL.md)`,
      `3. Check that ${name}/SKILL.md exists and its frontmatter says name: ${name}.`,
      `4. Read SKILL.md, then tell me in two or three sentences what the skill does and when it will trigger, and list any dependencies it mentions (Python packages, npm packages, CLIs) that aren't installed yet. Don't install them without asking.`,
      `5. Remove ${clone} when you're done.`,
      ...(bundleNote ? [``, `Note: ${bundleNote}`] : []),
    ].join("\n"),
  });

  methods.push({
    id: "npx",
    label: "skills CLI",
    kind: "Terminal",
    note: "One command; the skills.sh installer detects your agents (Claude Code, Cursor, Codex, and more).",
    copy: `npx skills add ${url} --skill ${book.slug}`,
    link: book.installs !== null ? { href: `https://skills.sh/${repo}/${book.slug}`, label: "This skill on skills.sh" } : undefined,
  });

  if (book.plugin) {
    const { name: plugin, marketplace, addMarketplace, skills } = book.plugin;
    const others = skills.filter((s) => s !== book.slug);
    methods.push({
      id: "claude-code",
      label: "Claude Code",
      kind: "Claude Code",
      note:
        others.length > 6
          ? `Installs the whole ${plugin} plugin — all ${skills.length} of its skills.${addMarketplace ? "" : " The marketplace ships with Claude Code."}`
          : others.length
            ? `Installs the ${plugin} set, which also includes ${others.join(", ")}.`
            : `Installs ${plugin} from the ${marketplace} marketplace.`,
      copy: [addMarketplace ? `/plugin marketplace add ${addMarketplace}` : null, `/plugin install ${plugin}@${marketplace}`]
        .filter(Boolean)
        .join("\n"),
    });
  }

  methods.push({
    id: "claude-ai",
    label: "Claude.ai",
    note:
      book.source.repo === "anthropics/skills"
        ? "Anthropic’s example skills ship with paid plans — you may only need to switch this one on."
        : "Upload the .zip as a custom skill.",
    steps: [
      "In Settings → Capabilities, turn on “Code execution and file creation”.",
      ...(book.source.repo === "anthropics/skills"
        ? ["Go to Customize → Skills. If this skill is listed, toggle it on and you’re done.", "Otherwise download the .zip above, then click + → Create skill → Upload a skill and choose it."]
        : ["Download the .zip above.", "Go to Customize → Skills, click + → Create skill → Upload a skill, and choose it."]),
    ],
    link: { href: "https://support.claude.com/en/articles/12512180-using-skills-in-claude", label: "Anthropic’s guide to using skills" },
  });

  return methods;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
