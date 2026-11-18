# Skill Press

Agent skills, typeset and bound as books you can page through and then install. The design takes its cues from [stripe.press](https://stripe.press).

| Library | Author | Skills | License |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Anthropic | 19 | Apache 2.0 (one skill has no license file) |
| [obra/superpowers](https://github.com/obra/superpowers) | Jesse Vincent | 15 | MIT |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Corey Haines | 53 | MIT |

- **Ranking:** install counts from the [skills.sh](https://skills.sh) leaderboard. Skills it doesn't list yet appear at the end of their topic.
- Books sit together by primary task across the catalogue, shelf, and 3D room. For example, **Testing & Code Review** includes browser testing, debugging, and reviewing changes. The **Author** filter narrows any topic to a particular author. Within each topic, books follow their install rank.
- **Books:** each one is the skill's `SKILL.md`. The **downloads** are the whole skill folder, plus the library's license.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Add a library

1. Add an entry to `sources.json`: the repo, the folder holding the skills, the author, and how Claude Code installs it.
2. Run `npm run import`.
3. Push. The new books appear with generated covers.

To give books their own titles and covers, add entries in `src/lib/designs.ts`. Superpowers and Marketing Skills each use one series template there, so a whole library takes one table. Topic names and shelf order live in `src/lib/categories.ts`. File a skill by its primary task in `src/lib/classifyTopic.ts`, using the upstream repo and folder to identify the edition. An unreviewed import with a single clear topic match uses its own name and description. Ambiguous imports appear under **Awaiting Classification**.

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

The Reading Room opens at `/`. Select **Enter the library** to walk the 3D stacks. Drag to look, use WASD to move, or use the on-screen arrows. Selecting a shelf takes you directly to its bookcase. Click a book or use the volume picker to read it. The catalogue beneath the entrance also works on devices without WebGL.

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

The built-in ImageGen tool produced three original illustrations. They are served as local WebP assets.

**Entrance — `public/reading-room.webp`**

Ultra-wide 2.7:1 editorial architectural photograph for the opening screen of an independent digital library. The camera stands at eye level inside a beautiful, intimate, historic publisher’s reading room: book-filled tall dark walnut shelves at left and across far right, polished wood mullions, warm brass wall sconces and a single green glass banker's lamp, atmospheric afternoon sunlight streaming from tall arched multi-pane windows on the right, an inviting open aisle, a long wooden reading table and worn dark green leather chairs mainly right of center. Sunlight shafts, specular warm amber flecks, authentic old hardcover spines, worn oak floor. Calm, human-scale, quiet, photoreal, richly textured, understated analog film still, nuanced shadows, no HDR, no artificial orange cast. Wide horizontal landscape with beautiful deep architectural perspective; place the principal bright arch, lamp, and impressive woodwork in the middle and right of frame; leftmost third is shadowed shelves with some visible texture, suitable for overlaying cream typography. No text, no type, no interface, no watermark, no logo, no people.

**Archive bindings — `public/archive-bindings.webp`**

A seamless-ready architectural material photograph, square aspect, for the wall of a 3D library. Precisely front-on tightly cropped orthographic elevation of ONE bay of a real 19th-century dark walnut library bookcase, with FOUR evenly spaced horizontal rows packed with varied old leatherbound and linen hardback book spines. Finely detailed gold tooling, burgundy, green, tan, russet, black, little embossed titles. Straight horizontal dark oak shelves and a narrow carved vertical frame at left and right exactly along the edge. Flat neutral warm exposure, daylight, clearly visible fine wood grain, realistic patina, photoreal not painting. Pack books in a natural irregular rhythm. The entire flat image is only books and shelves from straight in front, all lines parallel, filling frame edge-to-edge, no floor, no furniture, no perspective, no wall, no room, no lamps, no people, no legible text, no watermark.

**Window wall — `public/window-wall.webp`**

Wide 2:1 horizontal photorealistic architectural material plate for a 3D library wall. A square-on, perfectly centered FRONT ELEVATION photograph of the end wall of an elegant tiny English publisher's library. An enormous luminous arched leaded-glass window in the middle looking out on softly defocused leafy green trees in afternoon sun, bookcases filled with beautifully varied vintage leather and linen books to either side, dark walnut wall panels beneath the window, carved walnut mouldings, two warm brass sconces. Refined nineteenth-century craftsmanship with real aged patina. Edge-to-edge wall from skirting board at bottom to cornice at top. Lens shift keeps every vertical line parallel and every horizontal line level. ONLY the face of the flat wall. No foreground tables or furniture, floor, ceiling or perpendicular side walls, absolutely no perspective vista, no people, no text. Fine grain, filmic architectural photography, warm but believable amber-green hues, soft indirect daylight. Must look like a physically plausible material plate, not a painting.

</details>
