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
  const { url, repo, bundleNote } = book.source;
  const name = book.skillName;
  const dir = book.sourcePath;
  const clone = '"$skill_checkout"';
  const methods: InstallMethod[] = [];

  if (book.source.id === "grok-build") {
    return [{
      id: "upstream", label: "Grok Build bridge", note: bundleNote!,
      link: { href: `${url}/tree/${book.source.commit}`, label: "Open xAI’s plugin and setup guide" },
    }];
  }
  if (book.platforms.includes("deepseek")) {
    methods.push({
      id: "deepseek", label: "DeepSeek Harness",
      note: book.sourcePath.startsWith(".agents/") ?
        "This contributor skill is already included in a checkout of DeepSeek Harness." :
        "DeepSeek ships this edition in its Office skill package.",
      steps: [
        "To use the downloaded edition in another Harness project, extract the ZIP into .agents/skills/ at the project root.",
        `Check for .agents/skills/${book.slug}/SKILL.md and start a Harness session in that project.`,
      ],
      link: { href: `${url}/blob/${book.source.commit}/docs/subsystems/skills.md`, label: "DeepSeek skill discovery" },
    });
  }
  if (book.platforms.includes("chatgpt")) {
    const listings: Record<string, string | undefined> = {
      stripe: "https://chatgpt.com/plugins/stripe",
      obsidian: "https://chatgpt.com/plugins/plugins_6aee4fde227881919d61b034b1c31096",
      "open-seo": "https://chatgpt.com/plugins/plugin_asdk_app_6abddd2c7e4c819191f1398c4bd8e9b3",
    };
    const listing = listings[book.source.id];
    methods.push({
      id: "chatgpt", label: "ChatGPT",
      note: listing ? "Open the publisher’s plugin in ChatGPT and install it in your workspace." :
        "A workspace administrator can import the publisher’s plugin into a managed ChatGPT workspace.",
      link: { href: listing ?? `${url}/tree/${book.source.commit}#installation`,
        label: listing ? "Open in ChatGPT" : "Publisher’s workspace installation guide" },
    });
  }
  methods.push({
    id: "agent",
    label: "Agent prompt",
    kind: "Prompt",
    note: "Paste into a coding agent with terminal access. Check the upstream requirements for the skill you’re installing.",
    copy: [
      `Install the "${name}" Agent Skill by ${book.source.author}, from ${url}.`,
      ``,
      `1. Fetch the whole folder ${dir} — SKILL.md plus every script, reference, and asset beside it, not just SKILL.md. For example:`,
      '   skill_checkout=$(mktemp -d)',
      `   git init ${clone}`,
      `   git -C ${clone} fetch --depth 1 ${url}.git ${book.source.commit}`,
      `   git -C ${clone} checkout --detach FETCH_HEAD`,
      `2. Copy it into your skills directory as a folder named "${book.slug}":`,
      `   - Claude Code: ~/.claude/skills/${book.slug}/ (all projects) or .claude/skills/${book.slug}/ (this project only)`,
      `   - Another agent: the directory you load Agent Skills from (folders containing a SKILL.md)`,
      `3. Check that ${book.slug}/SKILL.md exists and its frontmatter says name: ${name}.`,
      `4. Read SKILL.md, then tell me in two or three sentences what the skill does and when it will trigger, and list any dependencies it mentions (Python packages, npm packages, CLIs) that aren't installed yet. Don't install them without asking.`,
      ...(bundleNote ? [``, `Note: ${bundleNote}`] : []),
    ].join("\n"),
  });

  methods.push({
    id: "npx",
    label: "skills CLI",
    kind: "Terminal",
    note: "One command; the skills.sh installer detects your agents (Claude Code, Cursor, Codex, and more).",
    copy: `npx skills add ${book.sourceUrl} --skill ${book.skillName}`,
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
          ? `Installs the whole ${plugin} plugin, including this skill.${addMarketplace ? "" : " The marketplace ships with Claude Code."}`
          : others.length
            ? `Installs the ${plugin} set, which also includes ${others.join(", ")}.`
            : `Installs ${plugin} from the ${marketplace} marketplace.`,
      copy: [addMarketplace ? `/plugin marketplace add ${addMarketplace}` : null, `/plugin install ${plugin}@${marketplace}`]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (book.source.repo === "anthropics/skills" || !book.source.bundleNote && book.platforms.includes("claude")) methods.push({
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
