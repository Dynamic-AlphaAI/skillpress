import type { Topic } from "./categories";

type FiledTopic = Exclude<Topic, "unfiled">;

// File each edition by its primary task. Repository + folder identifies an edition
// even if another publisher later imports a different skill with the same name.
const subjects: Record<FiledTopic, string[]> = {
  "writing-documents": [
    "anthropics/skills/doc-coauthoring", "anthropics/skills/docx", "anthropics/skills/pdf",
    "anthropics/skills/pptx", "anthropics/skills/internal-comms", "coreyhaines31/marketingskills/copywriting",
    "coreyhaines31/marketingskills/copy-editing", "coreyhaines31/marketingskills/content-strategy",
  ],
  "design-media": [
    "anthropics/skills/algorithmic-art", "anthropics/skills/brand-guidelines", "anthropics/skills/canvas-design",
    "anthropics/skills/frontend-design", "anthropics/skills/slack-gif-creator", "anthropics/skills/theme-factory",
    "coreyhaines31/marketingskills/image", "coreyhaines31/marketingskills/video",
    "coreyhaines31/marketingskills/ad-creative",
  ],
  "software-development": [
    "anthropics/skills/claude-api", "anthropics/skills/mcp-builder", "anthropics/skills/web-artifacts-builder",
    "obra/superpowers/using-git-worktrees", "obra/superpowers/finishing-a-development-branch",
    "coreyhaines31/marketingskills/free-tools", "coreyhaines31/marketingskills/site-architecture",
  ],
  "testing-review": [
    "anthropics/skills/webapp-testing", "obra/superpowers/test-driven-development",
    "obra/superpowers/systematic-debugging", "obra/superpowers/requesting-code-review",
    "obra/superpowers/receiving-code-review", "obra/superpowers/verification-before-completion",
  ],
  "ai-automation": [
    "anthropics/skills/skill-creator", "anthropics/skills/academy-guide", "anthropics/skills/discernment-nudge",
    "obra/superpowers/writing-skills", "obra/superpowers/using-superpowers", "obra/superpowers/diagnosing-superpowers",
    "obra/superpowers/dispatching-parallel-agents", "obra/superpowers/subagent-driven-development",
    "coreyhaines31/marketingskills/marketing-loops",
  ],
  "research-planning": [
    "obra/superpowers/brainstorming", "obra/superpowers/writing-plans", "obra/superpowers/executing-plans",
    "coreyhaines31/marketingskills/customer-research", "coreyhaines31/marketingskills/competitor-profiling",
    "coreyhaines31/marketingskills/reverse-engineer-marketing", "coreyhaines31/marketingskills/marketing-council",
    "coreyhaines31/marketingskills/marketing-ideas", "coreyhaines31/marketingskills/marketing-plan",
    "coreyhaines31/marketingskills/marketing-psychology", "coreyhaines31/marketingskills/product-marketing",
  ],
  "data-analytics": [
    "anthropics/skills/xlsx", "coreyhaines31/marketingskills/analytics", "coreyhaines31/marketingskills/attribution",
    "coreyhaines31/marketingskills/conversion-tracking", "coreyhaines31/marketingskills/ab-testing",
  ],
  "search-discovery": [
    "coreyhaines31/marketingskills/ai-seo", "coreyhaines31/marketingskills/seo-audit",
    "coreyhaines31/marketingskills/programmatic-seo", "coreyhaines31/marketingskills/aso",
    "coreyhaines31/marketingskills/schema", "coreyhaines31/marketingskills/link-building",
    "coreyhaines31/marketingskills/directory-submissions", "coreyhaines31/marketingskills/competitors",
  ],
  "conversion-retention": [
    "coreyhaines31/marketingskills/cro", "coreyhaines31/marketingskills/signup",
    "coreyhaines31/marketingskills/onboarding", "coreyhaines31/marketingskills/churn-prevention",
    "coreyhaines31/marketingskills/paywalls", "coreyhaines31/marketingskills/popups",
    "coreyhaines31/marketingskills/lead-magnets",
  ],
  "campaigns-outreach": [
    "coreyhaines31/marketingskills/ads", "coreyhaines31/marketingskills/emails", "coreyhaines31/marketingskills/sms",
    "coreyhaines31/marketingskills/social", "coreyhaines31/marketingskills/co-marketing",
    "coreyhaines31/marketingskills/community-marketing", "coreyhaines31/marketingskills/influencer-marketing",
    "coreyhaines31/marketingskills/public-relations", "coreyhaines31/marketingskills/events",
    "coreyhaines31/marketingskills/launch", "coreyhaines31/marketingskills/referrals",
  ],
  "sales-pricing": [
    "coreyhaines31/marketingskills/sales-enablement", "coreyhaines31/marketingskills/prospecting",
    "coreyhaines31/marketingskills/revops", "coreyhaines31/marketingskills/cold-email",
    "coreyhaines31/marketingskills/pricing", "coreyhaines31/marketingskills/offers",
  ],
};

const editions = new Map<string, FiledTopic>();
for (const topic of Object.keys(subjects) as FiledTopic[]) {
  for (const edition of subjects[topic]) {
    if (editions.has(edition)) throw new Error(`Multiple primary topics for ${edition}`);
    editions.set(edition, topic);
  }
}

// New imports can be shelved immediately when their own purpose is unambiguous.
const signals: Record<FiledTopic, RegExp> = {
  "writing-documents": /\b(copywriting|copy editing|proofread\w*|technical writing|word documents?|slide decks?|pdfs?)\b/i,
  "design-media": /\b(visual design|graphic design|typography|illustration|image editing|video editing|animation)\b/i,
  "software-development": /\b(api integration|web development|web applications?|git worktrees?|mcp servers?)\b/i,
  "testing-review": /\b(debugging|test automation|unit tests?|integration tests?|code review|test driven development)\b/i,
  "ai-automation": /\b(ai agents?|agent skills?|subagents?|workflow automation)\b/i,
  "research-planning": /\b(customer research|competitor research|project planning|brainstorming|market research)\b/i,
  "data-analytics": /\b(spreadsheets?|data analysis|analytics|attribution|a\/b test\w*)\b/i,
  "search-discovery": /\b(seo|search engine optimization|backlinks?|schema markup|app store optimization)\b/i,
  "conversion-retention": /\b(conversion optimization|customer retention|onboarding|churn|paywalls?)\b/i,
  "campaigns-outreach": /\b(email campaigns?|paid ads|public relations|social media|influencer marketing)\b/i,
  "sales-pricing": /\b(pricing|sales enablement|prospecting|sales pipeline|revenue operations)\b/i,
};

export function categoryFor(repo: string, slug: string, description: string): Topic {
  const assigned = editions.get(`${repo}/${slug}`);
  if (assigned) return assigned;
  const purpose = `${slug.replace(/[-_]/g, " ")} ${description.split(/[.!?](?:\s|$)/, 1)[0]}`;
  const matches = (Object.keys(signals) as FiledTopic[]).filter((topic) => signals[topic].test(purpose));
  return matches.length === 1 ? matches[0] : "unfiled";
}
