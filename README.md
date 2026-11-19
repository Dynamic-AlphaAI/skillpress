# Skill Press

Agent skills, typeset and bound as books you can page through and then install. The design takes its cues from [stripe.press](https://stripe.press).

## Source libraries

The catalogue contains 323 editions from 13 repositories. The ten additions were selected for project-maintainer provenance, published skill directories, identifiable licenses, and coverage of distinct tasks. Each edition links to the upstream files at the revision used for its download.

| GitHub repository | Subject matter | Editions | License |
|---|---|---:|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Documents, design and AI tools | 19 | Apache 2.0, one unspecified |
| [obra/superpowers](https://github.com/obra/superpowers) | Software development practices | 15 | MIT |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Marketing and growth | 53 | MIT |
| [googleworkspace/cli](https://github.com/googleworkspace/cli) | Workspace documents, mail, calendars and team workflows | 95 | Apache 2.0 |
| [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | Browser automation and testing | 1 | Apache 2.0 |
| [huggingface/skills](https://github.com/huggingface/skills) | Model training, evaluation and deployment | 25 | Apache 2.0, hf-mem declares MIT |
| [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | Interface design systems and implementation | 16 | Apache 2.0 |
| [expo/skills](https://github.com/expo/skills) | React Native, mobile releases and testing | 23 | MIT |
| [cloudflare/skills](https://github.com/cloudflare/skills) | Cloud applications, infrastructure and observability | 22 | Apache 2.0 |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) | Databases and PostgreSQL performance | 2 | MIT |
| [stripe/ai](https://github.com/stripe/ai) | Payments, billing and revenue operations | 12 | MIT |
| [hashicorp/agent-skills](https://github.com/hashicorp/agent-skills) | Terraform providers, infrastructure and Packer images | 20 | MPL 2.0 |
| [WordPress/agent-skills](https://github.com/WordPress/agent-skills) | WordPress blocks, plugins, themes and operations | 20 | GPL 2.0 or later |

- **Ranking:** install counts from the [skills.sh](https://skills.sh) leaderboard. Skills it doesn't list yet appear at the end of their topic.
- Books sit together by primary task across the catalogue, shelf, and 3D room. For example, **Testing & Code Review** includes browser testing, debugging, and reviewing changes. The **Author** filter narrows any topic to a particular author. Within each topic, books follow their install rank.
- **Books:** each one is the skill's `SKILL.md`. The **downloads** are the whole skill folder, plus the library's license.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Add a library

1. Add an entry to `sources.json`: the repository, canonical skill directory, author, and reviewed commit in `revision`. Use `additionalPaths` for separate published plugins. Only include each canonical directory once.
2. Run `npm run import`.
3. Push. The new books appear with generated covers.

To give books their own titles and covers, add entries in `src/lib/designs.ts`. Superpowers and Marketing Skills each use one series template there, so a whole library takes one table. Topic names and shelf order live in `src/lib/categories.ts`. File a skill by its primary task in `src/lib/classifyTopic.ts`, using the upstream repo and folder to identify the edition. An unreviewed import with a single clear topic match uses its own name and description. Ambiguous imports appear under **Awaiting Classification**.

## Keeping it up to date

A GitHub Action (`.github/workflows/update-skills.yml`) runs `npm run import` every day at 06:17 UTC. If anything changed and the site still builds, it commits to `main`, and Vercel deploys that commit. You can also run it from the Actions tab.

`npm run import` reads the reviewed revisions of the ten new collections, follows the default branches of the original three, and refreshes install counts. Change a pinned revision after reviewing its upstream diff. The importer requires YAML skill metadata and instructions, and packages tracked files. Duplicate folder IDs, normalized skill names, or matching instruction bodies share one edition. Source order determines which edition supplies all downloads. A successful import replaces two folders:

- `content/`: the text each book is typeset from, plus `catalog.json`.
- `public/downloads/`: `<skill>.zip`, `<skill>/SKILL.md`, `<library>-skills.zip`, and `skillpress-all.zip`. Zips are byte-identical when nothing changed, so the daily job doesn't keep re-committing them.

## Getting a skill

**Get skill** (in the footer, the reader, or by pressing `g`) opens a panel with:

- **Download .zip**: the whole skill folder, ready for a skills directory or for Claude.ai's *Customize → Skills → Upload a skill*.
- **SKILL.md only**: just the instructions.
- **Agent prompt**: paste it into Claude Code, Codex, Cursor, or any agent that runs commands, and it installs the skill and reports back what it does.
- **skills CLI** installs from the edition’s pinned GitHub directory using the name declared in its frontmatter.
- **Claude Code**: the plugin command published by each library.
- **Claude.ai**: the toggle-or-upload steps.

## Using it

Choose **Search** in the header to look up skills by keyword, title, publisher, topic, or words in the instructions. Results update as you type. Use **Topic** and **Author** to narrow them, then select a result to read the book. A link such as [a search for PDF extraction](https://skillpress.xyz/?q=pdf+extraction) restores the query. The full-text index is built from the same checked-in editions as the reader and loads when Search opens.

The Reading Room opens at `/`. Select **Enter the library** to walk the 3D stacks. Drag to look, use WASD to move, or use the on-screen arrows. Selecting a shelf takes you to its labelled row. Up to twelve catalogue books share a row, and up to four rows share a bookcase. The room displays each matching edition once, including when you filter down to a single book. Click a book or use the volume picker to read it. The catalogue beneath the entrance also works on devices without WebGL.

The sound control in the masthead and reader remembers your preference on this device. In a book’s details, drag the cover or press **Turn book** to inspect its boards, spine, and printed back.

**Shelf and Featured controls**

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

Direct links include `/?walk` for the walkthrough and `/?view=shelf` for the original shelf, alongside `/?category=writing-documents`, `/?author=jesse-vincent`, `/?book=pdf&read&page=4`, `/?book=cro&install`, `/?view=featured`. With no book chosen, the shelf opens on its middle book.

## How it's built

- `sources.json`: the libraries on the shelf.
- `scripts/import-skills.mjs`: pulls the skills, ranks them, and builds the zips (with `fflate`, so no system `zip` is needed).
- `src/lib/library.ts`: parses frontmatter and renders the markdown on the server. Raw HTML is escaped, relative links point at GitHub, and heading ids feed the contents pages.
- `src/lib/install.ts`: the install methods. The commands match each library's README and skills.sh.
- `src/components/Shelf.tsx` and `Book3D.tsx`: the shelf. Each book is a CSS 3D box, and its thickness follows the word count.
- `src/components/CoverArt.tsx`: generated SVG covers, one motif per skill.
- `src/components/useUrlState.ts`: the URL is the single source of truth for what's on screen, and the page itself is fully static.
- `src/components/ReadingRoom.tsx` and `WalkingRoom.tsx` present the gallery and its keyboard- and touch-accessible shelf controls. The Three.js scene in `roomScene.ts` loads on entry, renders on demand, and generates bookcases from the filtered catalogue.
- `src/components/sound.ts` synthesizes footsteps, book handling, and paper sounds locally with Web Audio.
- `src/app/editions/[id]/route.ts` builds a static edition for each book. The reader fetches the selected edition when it opens.
- `src/components/Reader.tsx`: the book itself. Text flows through CSS columns at a fixed page size, so pagination is the same at every window size. The whole book is then scaled to fit. Pages turn with the Web Animations API, and the turning leaf stays mounted so long books turn smoothly.
- `src/components/Details.tsx`: details, downloads, and copy-ready install instructions.


<details>
<summary>Reading Room artwork and generation prompts</summary>

The built-in ImageGen tool produced two architectural backgrounds. All book covers and spines in the room are drawn separately from the catalogue.

**Entrance, `public/entrance-hall.webp`**

An ultra-wide, photoreal English Arts and Crafts vestibule at eye level, with hand-carved walnut panels, an amber doorway, a green leather settee, a brass lamp and afternoon light on a herringbone oak floor. Keep the left third shadowed for the title. Every visible room is book-free.

**Window wall, `public/paneled-window.webp`**

A square-on 2:1 elevation with a central arched window overlooking green trees, two brass sconces, and solid walnut wainscoting. Frame only the face of the wall, without shelves, books, furniture or lettering.

</details>
