# Browsing the Skill Press collections

Choose a topic above the catalogue to browse what a skill does. Each edition has one primary topic and one physical shelf. Counts beside the topic names show the size of each collection for the selected AI platform. Author and platform filters also work in search, on the shelf and in the walkthrough.

The main hall displays up to five editions per row. It draws three of every four editions within each ranked topic, giving newer and unranked titles a place near the entrance. The fourth goes to its subject room. Filtered collections of twelve editions or fewer fit entirely in the hall.

## AI platform filters

A **Built for** note identifies a host explicitly targeted by the publisher. A **Works with** note lists documented hosts when there is no designated primary host. A book’s subject alone does not establish compatibility. Shared platform links remain available below.

| Filter by platform | What you will find |
|---|---|
| [ChatGPT](https://skillpress.xyz/?platform=chatgpt) | Workspace plugins, published ChatGPT skills and books about ChatGPT, including OpenAI’s app-submission guide |
| [Codex](https://skillpress.xyz/?platform=codex) | OpenAI’s own Codex examples and other publishers’ documented Codex skills |
| [Claude](https://skillpress.xyz/?platform=claude) | Claude Code, Cowork and other Claude skills, from Anthropic and independent authors |
| [Grok](https://skillpress.xyz/?platform=grok) | Grok Build and Grok Bot plugins, xAI’s Claude bridge instructions and Cursor guides for the Grok Voice API |
| [DeepSeek](https://skillpress.xyz/?platform=deepseek&walk) | DeepSeek Harness project instructions and three Office skills packaged by DeepSeek |
| [Cursor](https://skillpress.xyz/?platform=cursor) | Cursor’s team kit and plugins from publishers that document Cursor support |
| [Gemini](https://skillpress.xyz/?platform=gemini) | Gemini CLI extensions, Gemini development tools and Gemini API guides |
| [GitHub Copilot](https://skillpress.xyz/?platform=copilot) | Copilot workflow skills, Microsoft’s Azure skills and compatible publisher collections |

**Runs in** identifies host support described by the upstream publisher or represented by a platform-specific plugin manifest. **Covers** identifies a platform explicitly taught by the edition. For example, the xAI guide runs inside the Claude Code bridge and covers Grok output. Its install panel links to the bridge because the guide is an internal plugin helper. A generic Agent Skills folder without host evidence remains discoverable through All, its author, its topic and keyword search.

Links preserve collection, search, compatible filters and the selected edition. Try [ChatGPT app submission](https://skillpress.xyz/?platform=chatgpt&q=submission) or [the DeepSeek reading room](https://skillpress.xyz/?platform=deepseek&walk). The masthead count and full-library download cover the entire catalogue. The ZIP named for a repository includes every published edition from that repository.

## Evidence for platform assignments

The catalogue stores publisher-wide hosts in `sources.json` under `platforms`, additions for individual editions under `editionPlatforms`, and subjects under `covers`. Use an edition-level entry when a marketplace lists only particular skills. Every edition links to the publisher’s exact skill directory. The release catalogue records the source revision used to interpret its README and manifests.

- OpenAI documents which ChatGPT surfaces support standalone skills and workspace plugins. The Obsidian publisher lists its ChatGPT plugin, LangChain documents managed-workspace import, and Stripe’s ChatGPT listing names individual bundled skills. The older OpenAI skills repository directs readers to its current plugin examples. [OpenAI skills guide](https://learn.chatgpt.com/docs/build-skills) · [Obsidian](https://github.com/obsidianmd/obsidian-skills) · [LangChain](https://github.com/langchain-ai/langchain-skills) · [Stripe listing](https://chatgpt.com/plugins/stripe) · [OpenAI examples](https://github.com/openai/skills)
- MongoDB documents its Claude, Cursor, Codex, Copilot and Grok plugin installations. xAI publishes the source of its Grok-to-Claude bridge. Cursor separately publishes a Grok Voice plugin for building audio features. [MongoDB](https://github.com/mongodb/agent-skills) · [xAI](https://github.com/xai-org/grok-build-plugin-cc) · [Cursor Grok Voice](https://github.com/cursor/plugins/tree/main/grok-voice)
- DeepSeek Harness discovers project skills in `.agents/skills` and also loads packaged skills. Its contributor guides assume a DeepSeek Harness checkout. [DeepSeek skill registry](https://github.com/deepseek-ai/deepseek-harness/blob/2e39e70496aa02986ca6a820c5d497e816b69d7e/docs/subsystems/skills.md)
- Claude’s knowledge-work plugins list Cowork and Claude Code as supported hosts. Google’s Gemini skills list several host-specific installations. Flutter publishes separate manifests for Claude, Cursor and Codex. [Anthropic](https://github.com/anthropics/knowledge-work-plugins) · [Google Gemini](https://github.com/google-gemini/gemini-skills) · [Flutter](https://github.com/flutter/agent-plugins)

## The November 19, 2026 accession

These 20 repositories contributed 134 editions. The stars below are a GitHub snapshot from the date of review. Smaller first-party projects qualified on publisher provenance, substantive instructions and redistribution terms. Select a repository to inspect its pinned revision.

| Pinned source | GitHub stars | Editions | Licenses | Subjects |
|---|---:|---:|---|---|
| [openai/skills](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431) | 28,843 | 3 | Apache-2.0 | Codex goals, CLI design and ASP.NET Core |
| [openai/plugins](https://github.com/openai/plugins/tree/981b02c0c44058b595f3b4180002c3ae3c806d40) | 8,021 | 1 | Apache-2.0 | ChatGPT app submission |
| [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/b4c9a4e1de4b42868b74a6fe30ac766f64e43a3e) | 36,568 | 23 | Apache-2.0 | Design, customer support, analytics and engineering |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/df9699a55c56707e9948a32951ea356638ea8519) | 47,724 | 5 | Apache-2.0 | Claude plugin authoring and team enablement |
| [cursor/plugins](https://github.com/cursor/plugins/tree/50b3a3234bf2e0293849a48784d72030948e44ee) | 17,502 | 11 | MIT | Code review, team workflows and Grok Voice |
| [xai-org/grok-build-plugin-cc](https://github.com/xai-org/grok-build-plugin-cc/tree/8070d2fc349a9e196f0db94c1f67b19a00b53907) | 281 | 1 | Apache-2.0 | Presenting Grok Build results in Claude Code |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness/tree/2e39e70496aa02986ca6a820c5d497e816b69d7e) | 284,169 | 14 | MIT | Harness contributor guides and Office documents |
| [google-gemini/gemini-skills](https://github.com/google-gemini/gemini-skills/tree/c4d0c62c1240e08a90546186bf320600ab6a039a) | 4,526 | 2 | Apache-2.0 | Gemini API and Live API development |
| [microsoft/skills](https://github.com/microsoft/skills/tree/b35d2c60fac796bfd2cfd14ad3f550c73e92d9bb) | 3,226 | 7 | MIT | Azure costs, storage and analytics |
| [getsentry/skills](https://github.com/getsentry/skills/tree/a582c51ee29d0f35e6ac321340796f77d43da733) | 1,186 | 6 | Apache-2.0 | API writing, branding and code review |
| [firebase/agent-skills](https://github.com/firebase/agent-skills/tree/99954a30898bb5ddc8152ee10e124dc3b4106bf7) | 520 | 8 | Apache-2.0 | Firebase hosting, analytics and data services |
| [neondatabase/agent-skills](https://github.com/neondatabase/agent-skills/tree/d3601d9e1f9398b96a1ee25047bafba5f04199eb) | 117 | 3 | Apache-2.0 | Postgres, realtime data and object storage |
| [prisma/skills](https://github.com/prisma/skills/tree/a6f192959cf43b08aa330fe1ffca090267215812) | 80 | 3 | MIT | Prisma Client, setup and driver adapters |
| [sanity-io/agent-toolkit](https://github.com/sanity-io/agent-toolkit/tree/1d9223c08237739ac862e6ec1c86540e58706222) | 201 | 7 | MIT | Structured content, Portable Text and SEO |
| [elastic/agent-skills](https://github.com/elastic/agent-skills/tree/09d879dfe23436684e11391a5e5a74a2aedd6b04) | 610 | 5 | Apache-2.0 | Elasticsearch indexing, relevance and queries |
| [flutter/agent-plugins](https://github.com/flutter/agent-plugins/tree/ff6d472ee66dbed566c4500edee460c94fde0a02) | 3,198 | 14 | BSD-3-Clause | Dart tests, Flutter layouts and localization |
| [mattpocock/skills](https://github.com/mattpocock/skills/tree/abeeaf95660ba9e8b7c753eb38f441ca707a8823) | 328,046 | 10 | MIT | Software design, testing, handoffs and teaching |
| [langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills/tree/0d4bed5b80fcdc658a6297cbc1093aaf49c06e39) | 1,349 | 3 | MIT | Building, tracing and monitoring LangChain agents |
| [anthropics/financial-services](https://github.com/anthropics/financial-services/tree/3e32c2287dcb637c184c01cc0ad82d6af7e9bb0f) | 41,403 | 4 | Apache-2.0 | Spreadsheet audits, earnings and variance analysis |
| [mongodb/agent-skills](https://github.com/mongodb/agent-skills/tree/ff9a88211c5a9fa74012bfa8b797132d510f9b44) | 206 | 4 | Apache-2.0 | MongoDB schemas, query tuning and streams |

## Design, analytics and product planning accessions

| Publisher revision | New editions | Topics |
|---|---:|---|
| [Product Compass](https://github.com/phuryn/pm-skills/tree/9af7bfd0bc47fdad43c2eaa7a43cd13918e7aaef) | 34 | Discovery, market research, pricing, requirements and writing. The publisher designs these skills for Claude Code and Cowork. |
| [dbt Labs](https://github.com/dbt-labs/dbt-agent-skills/tree/b8facde20b7a92c40ce3e6b86b71c4b92aa44040) | 9 | Semantic models, data lineage, warehouse queries and unit tests. |
| [Julien Thibeaut](https://github.com/ibelick/ui-skills/tree/347d3189830f8ec3c4c041421bce19182a79dc7a) | 9 | UI composition, design documentation, accessibility, metadata and animation performance. Improve UI declares ChatGPT and Codex in its product manifest. |
| [Slidev](https://github.com/slidevjs/slidev/tree/437f139ccd4c8482a193b217922e7800a5b3baec/skills/slidev) | 1 | Markdown slide decks, speaker notes and interactive presentations. The publisher documents Claude Code as the host. |

## The November 20 marketing and analytics review

Ten nominated repositories yielded 67 new editions from six sources. The table links to the exact revisions reviewed. All six additions use MIT terms for the selected folders. Reading and downloading the books requires no service connection. Running some workflows in an agent requires the tools below.

| Pinned publisher | Editions | Using the workflows |
|---|---:|---|
| [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo/tree/468ed5b0d9e3249394783710e54abb02837e326b) | 17 | Some workflows use the Claude SEO plugin’s local checks and reference data. Install the upstream plugin to run those checks. |
| [every-app/open-seo](https://github.com/every-app/open-seo/tree/af3f995fe3ebbe21298df152465a5436842354ee) | 12 | Live research uses an OpenSEO project and its MCP connection. Self-hosted DataForSEO lookups use your provider account and can incur charges. |
| [ScrapeCreators/social-media-research-skills](https://github.com/ScrapeCreators/social-media-research-skills/tree/64ba7b4dea71e130d2712ffb6c1c1024b3b7c4b2) | 13 | Running live social research uses a ScrapeCreators API key and credits in your own agent. |
| [TheCraigHewitt/seomachine](https://github.com/TheCraigHewitt/seomachine/tree/120e7b46dc07c98382cd4f68ac5b6515ab9f2604) | 1 | Growth Lead can work from the business goals, constraints and metrics you provide. |
| [Ryze-AI-Adgent/open-seo-mcp-skills](https://github.com/Ryze-AI-Adgent/open-seo-mcp-skills/tree/f587b0a69dc1ed92b65cdb241e4f14985b1031fd) | 8 | Live reports use the Ryze MCP connector and authorized data sources such as Google Search Console, GA4 or Google Ads. |
| [PostHog/posthog](https://github.com/PostHog/posthog/tree/b7bb6c25dda489af1b71f2da4e3e9a7037f2ff8d) | 16 | These workflows use PostHog product tools and project data. Some need features such as experiments, heatmaps or AI visibility enabled in your PostHog project. |

All 53 current skill names in [Corey Haines’s repository](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1) already had editions. Of [SEO Machine’s 26 skill files](https://github.com/TheCraigHewitt/seomachine/tree/120e7b46dc07c98382cd4f68ac5b6515ab9f2604/.claude/skills), 25 match [Corey’s earlier source files](https://github.com/coreyhaines31/marketingskills/tree/a04cb61a577a20d9ab0f3da2a2d99c17a0476ded/skills) byte for byte. Growth Lead is the distinct addition. Independent keyword research editions from OpenSEO and Ryze have their own credits and downloads.

[Postiz](https://github.com/gitroomhq/postiz-app/tree/6be4874631fea453f99115a78fd543c71820ab45), [Umami](https://github.com/umami-software/umami/tree/aad2c4cedd5c0b3bc4d361843830a0bb47cf79c4) and [listmonk](https://github.com/knadh/listmonk/tree/e735e0b23421192a4c1b18b6221f4708b872fcd5) had no tracked `SKILL.md` files. For PostHog, the selected product folders are outside its separately licensed enterprise tree. For Claude SEO, each archive retains the skill’s local copyright notice when present and includes the full root MIT terms. The SEO Content Brief edition credits its named contributor, puneetindersingh.

## Reviewing and reproducing an import

1. Verify the canonical repository, publisher and immutable commit. Inspect each candidate’s instructions, references, metadata and nearest license. Keep distinct authors’ editions. Skip reprints, redirect stubs, unlicensed material and folders with unreviewed executable files.
2. Record the reviewed folders under `skillPaths`, their subjects under `topics`, and the verified platform mappings. A pinned reviewed folder accepts regular Markdown and license notices. A passive PNG or editor metadata file requires an individually reviewed Git blob ID in `reviewedAssets`. The importer rejects scripts, executable modes and symbolic links in those folders.
3. Run `npm run import`. To reproduce an earlier release for a source without a manifest pin, use its commit from that release’s `content/catalog.json` and supply the local checkout with `--src id=/path/to/checkout`. The importer stages its output, verifies Git provenance, and retains existing edition IDs. If the popularity service is unavailable, it retains the last saved install counts.
4. Run `npm test`, `npm run lint`, and `npm run build`. The tests compare individual, repository and full-library ZIP contents, cover the metadata and path restrictions, round-trip shared links, and walk every room in every platform collection.
5. Run `npx playwright install chromium`, start the production build with `npm start`, then run `npm run test:browser -- http://localhost:3000`. Pass the public origin to the same check after deployment. It exercises a real WebGL camera, room and volume pickers, a ladder, mobile browsing without WebGL, scoped search, reader history and a ZIP download.
