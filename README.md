# Skill Press

Agent skills, typeset and bound as books you can page through and then install. The design takes its cues from [stripe.press](https://stripe.press).

| Library | Author | Skills | License |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Anthropic | 19 | Apache 2.0 (one skill has no license file) |
| [obra/superpowers](https://github.com/obra/superpowers) | Jesse Vincent | 15 | MIT |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Corey Haines | 53 | MIT |

- **Ranking:** install counts from the [skills.sh](https://skills.sh) leaderboard. Skills it doesn't list yet are shelved last.
- **Filters:** browse by subject (Documents, Creative & Design, Development & Technical, Enterprise & Communication, Workflow & Process, Marketing & Growth) and by author.
- **Books:** each one is the skill's `SKILL.md`. The **downloads** are the whole skill folder, plus the library's license.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Add a library

1. Add an entry to `sources.json`: the repo, the folder holding the skills, the author, a default subject, and how Claude Code installs it.
2. Run `npm run import`.
3. Push. The new books appear with generated covers.

To give books their own titles and covers, add entries in `src/lib/designs.ts`. Superpowers and Marketing Skills each use one series template there, so a whole library takes one table. To file a skill under a different subject, add it in `src/lib/categories.ts`.

## Keeping it up to date

A GitHub Action (`.github/workflows/update-skills.yml`) runs `npm run import` every day at 06:17 UTC. If anything changed and the site still builds, it commits to `main`, and Vercel deploys that commit. You can also run it from the Actions tab.

`npm run import` clones every library, ranks the skills with skills.sh, and rewrites two folders:

- `content/`: the text each book is typeset from, plus `catalog.json`.
- `public/downloads/`: `<skill>.zip`, `<skill>/SKILL.md`, `<library>-skills.zip`, and `skillpress-all.zip`. Zips are byte-identical when nothing changed, so the daily job doesn't keep re-committing them.

## Getting a skill

**Get skill** (in the footer, the reader, or by pressing `g`) opens a panel with:

- **Download .zip**: the whole skill folder, ready for a skills directory or for Claude.ai's *Customize → Skills → Upload a skill*.
- **SKILL.md only**: just the instructions.
- **Agent prompt**: paste it into Claude Code, Codex, Cursor, or any agent that runs commands, and it installs the skill and reports back what it does.
- **skills CLI**: `npx skills add https://github.com/anthropics/skills --skill <name>`.
- **Claude Code**: the plugin command published by each library.
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

Every state has a link: `/?category=documents`, `/?author=jesse-vincent`, `/?book=pdf&read&page=4`, `/?book=cro&install`, `/?view=featured`. With no book chosen, the shelf opens on its middle book.

## How it's built

- `sources.json`: the libraries on the shelf.
- `scripts/import-skills.mjs`: pulls the skills, ranks them, and builds the zips (with `fflate`, so no system `zip` is needed).
- `src/lib/library.ts`: parses frontmatter and renders the markdown on the server. Raw HTML is escaped, relative links point at GitHub, and heading ids feed the contents pages.
- `src/lib/install.ts`: the install methods. The commands match each library's README and skills.sh.
- `src/components/Shelf.tsx` and `Book3D.tsx`: the shelf. Each book is a CSS 3D box, and its thickness follows the word count.
- `src/components/CoverArt.tsx`: generated SVG covers, one motif per skill.
- `src/components/useUrlState.ts`: the URL is the single source of truth for what's on screen, and the page itself is fully static.
- `src/components/Reader.tsx`: the book itself. Text flows through CSS columns at a fixed page size, so pagination is the same at every window size. The whole book is then scaled to fit. Pages turn with the Web Animations API, and the turning leaf stays mounted so long books turn smoothly.
- `src/components/Details.tsx`: details, downloads, and copy-ready install instructions.
