# Skill Press

Every official Anthropic agent skill, typeset and bound as a book you can page through and then install. The design takes its cues from [stripe.press](https://stripe.press).

- **Library:** all 19 skills in [anthropics/skills](https://github.com/anthropics/skills), Anthropic's official skill library.
- **Ranking:** install counts from the [skills.sh](https://skills.sh) leaderboard. Skills it doesn't list yet are shelved last.
- **Categories:** the four skill sets named in the repo's README: Document Skills, Creative & Design, Development & Technical, and Enterprise & Communication.
- **Books:** each one is the skill's `SKILL.md`. The **downloads** are the whole skill folder, so they actually work.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Refresh the library

```bash
npm run import                  # every skill in the repo
npm run import -- --count 10    # only the most installed
```

This shallow-clones the repo, ranks it with skills.sh, and rewrites two folders:

- `content/`: the text each book is typeset from, plus `catalog.json`.
- `public/downloads/`: `<skill>.zip` (the full folder: scripts, references, assets), `<skill>/SKILL.md`, and `anthropic-skills.zip` with everything.

A new skill gets a generated cover. To give it its own title, palette, and cover motif, add an entry in `src/lib/designs.ts`. To shelve it under a category, add it in `src/lib/categories.ts`.

## Getting a skill

**Get skill** (in the footer, the reader, or by pressing `g`) opens a panel with:

- **Download .zip**: the whole skill folder, ready for a skills directory or for Claude.ai's *Customize → Skills → Upload a skill*.
- **SKILL.md only**: just the instructions.
- **Agent prompt**: paste it into Claude Code, Codex, Cursor, or any agent that runs commands, and it installs the skill and reports back what it does.
- **skills CLI**: `npx skills add https://github.com/anthropics/skills --skill <name>`.
- **Claude Code**: `/plugin marketplace add anthropics/skills`, then `/plugin install <set>@anthropic-agent-skills`.
- **Claude.ai**: the toggle-or-upload steps.

## Using it

| | |
|---|---|
| `←` `→` / scroll / drag | browse the shelf |
| click a spine | pull it out |
| click the cover, `Enter` | open the book |
| `g` | get the skill (downloads + install) |
| `i` | details |
| `f` | toggle the *Featured* view |
| in a book: `←` `→`, click a page, swipe | turn pages |
| `Home` / `End`, the scrubber | jump |
| `Esc` | close |

Every state has a link: `/?category=documents`, `/?book=pdf&read&page=4`, `/?book=xlsx&install`, `/?view=featured`.

## How it's built

- `scripts/import-skills.mjs`: pulls the skills, ranks them, and builds the zips (with `fflate`, so no system `zip` is needed).
- `src/lib/library.ts`: parses frontmatter and renders the markdown on the server. Raw HTML is escaped, relative links point at GitHub, and heading ids feed the contents pages.
- `src/lib/install.ts`: the install methods. The commands match the repo README and skills.sh.
- `src/components/Shelf.tsx` and `Book3D.tsx`: the shelf. Each book is a CSS 3D box, and its thickness follows the word count.
- `src/components/CoverArt.tsx`: generated SVG covers, one motif per skill.
- `src/components/Reader.tsx`: the book itself. Text flows through CSS columns at a fixed page size, so pagination is the same at every window size. The whole book is then scaled to fit. Pages turn with the Web Animations API, and the turning leaf stays mounted so long books turn smoothly.
- `src/components/Details.tsx`: details, downloads, and copy-ready install instructions.
