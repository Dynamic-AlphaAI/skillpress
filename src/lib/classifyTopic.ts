import type { Topic } from "./categories";

type FiledTopic = Exclude<Topic, "unfiled">;

// File each edition by its primary task. Repository + folder identifies an edition
// even if another publisher later imports a different skill with the same name.
const subjects: Record<FiledTopic, string[]> = {
  "payments-billing": [
    "stripe/ai/connect-recommend", "stripe/ai/metronome", "stripe/ai/stripe-best-practices",
    "stripe/ai/stripe-pay", "stripe/ai/upgrade-stripe", "stripe/ai/stripe-implementation-planner",
  ],
  "databases": [
    "cloudflare/skills/durable-objects", "cloudflare/skills/k2", "supabase/agent-skills/supabase",
    "supabase/agent-skills/supabase-postgres-best-practices",
  ],
  "mobile-development": [
    "google-labs-code/stitch-skills/react-native", "expo/skills/eas-app-stores", "expo/skills/eas-update",
    "expo/skills/expo-app-clip", "expo/skills/expo-brownfield", "expo/skills/expo-data-fetching",
    "expo/skills/expo-dev-client", "expo/skills/expo-dom", "expo/skills/expo-examples", "expo/skills/expo-module",
    "expo/skills/expo-native-ui", "expo/skills/expo-overview", "expo/skills/expo-project-structure",
    "expo/skills/expo-router", "expo/skills/expo-ui", "expo/skills/expo-upgrade",
    "expo/skills/expo-web-to-native",
  ],
  "cloud-infrastructure": [
    "huggingface/skills/hf-cloud-aws-context-discovery", "huggingface/skills/hf-cloud-python-env-setup",
    "huggingface/skills/hf-cloud-sagemaker-deployment-planner",
    "huggingface/skills/hf-cloud-sagemaker-production-defaults",
    "huggingface/skills/hf-cloud-serving-image-selection", "huggingface/skills/huggingface-spaces",
    "expo/skills/eas-hosting", "expo/skills/eas-workflows", "cloudflare/skills/cf-cli",
    "cloudflare/skills/cloudflare", "cloudflare/skills/cloudflare-app-bootstrap",
    "stripe/ai/stripe-projects", "cloudflare/skills/frameworks-on-cloudflare",
    "cloudflare/skills/nextjs-on-cloudflare", "cloudflare/skills/sandbox-migrate-to-next",
    "cloudflare/skills/sandbox-next", "cloudflare/skills/sandbox-stable",
    "cloudflare/skills/workers-best-practices", "cloudflare/skills/workers-development",
    "cloudflare/skills/wrangler", "hashicorp/agent-skills/aws-ami-builder",
    "hashicorp/agent-skills/azure-image-builder", "hashicorp/agent-skills/push-to-registry",
    "hashicorp/agent-skills/windows-builder", "hashicorp/agent-skills/azure-verified-modules",
    "hashicorp/agent-skills/refactor-module", "hashicorp/agent-skills/terraform-search-import",
    "hashicorp/agent-skills/terraform-stacks", "hashicorp/agent-skills/terraform-style-guide",
  ],
  "machine-learning": [
    "huggingface/skills/hf-mem",
    "huggingface/skills/hf-cli", "huggingface/skills/huggingface-best",
    "huggingface/skills/huggingface-community-evals", "huggingface/skills/huggingface-local-models",
    "huggingface/skills/huggingface-llm-trainer", "huggingface/skills/huggingface-vision-trainer",
    "huggingface/skills/huggingface-lora-space-builder", "huggingface/skills/huggingface-trackio",
    "huggingface/skills/huggingface-zerogpu", "huggingface/skills/train-sentence-transformers",
    "huggingface/skills/transformers-js", "huggingface/skills/trl-training",
  ],
  "identity-access": [
    "googleworkspace/cli/gws-admin-reports", "googleworkspace/cli/gws-modelarmor",
    "googleworkspace/cli/gws-modelarmor-create-template", "googleworkspace/cli/gws-modelarmor-sanitize-prompt",
    "googleworkspace/cli/gws-modelarmor-sanitize-response", "huggingface/skills/hf-cloud-sagemaker-iam-preflight",
    "cloudflare/skills/cloudflare-one-migrations", "cloudflare/skills/cloudflare-one", "cloudflare/skills/gateway-workers", "cloudflare/skills/turnstile-spin",
    "stripe/ai/connect-required-verification-information", "hashicorp/agent-skills/terraform-policy",
  ],
  "office-productivity": [
    "googleworkspace/cli/gws-calendar", "googleworkspace/cli/gws-calendar-agenda",
    "googleworkspace/cli/gws-calendar-insert", "googleworkspace/cli/gws-classroom",
    "googleworkspace/cli/gws-drive", "googleworkspace/cli/gws-drive-upload", "googleworkspace/cli/gws-keep",
    "googleworkspace/cli/gws-people", "googleworkspace/cli/gws-shared", "googleworkspace/cli/gws-tasks",
    "googleworkspace/cli/gws-workflow-email-to-task", "googleworkspace/cli/persona-event-coordinator",
    "googleworkspace/cli/persona-exec-assistant", "googleworkspace/cli/persona-hr-coordinator",
    "googleworkspace/cli/persona-it-admin", "googleworkspace/cli/persona-team-lead",
    "googleworkspace/cli/recipe-block-focus-time", "googleworkspace/cli/recipe-bulk-download-folder",
    "googleworkspace/cli/recipe-create-classroom-course", "googleworkspace/cli/recipe-create-events-from-sheet",
    "googleworkspace/cli/recipe-create-shared-drive", "googleworkspace/cli/recipe-create-task-list",
    "googleworkspace/cli/recipe-find-free-time", "googleworkspace/cli/recipe-find-large-files",
    "googleworkspace/cli/recipe-organize-drive-folder", "googleworkspace/cli/recipe-reschedule-meeting",
    "googleworkspace/cli/recipe-review-overdue-tasks", "googleworkspace/cli/recipe-schedule-recurring-event",
    "googleworkspace/cli/recipe-share-folder-with-team",
  ],
  "team-communication": [
    "googleworkspace/cli/gws-chat", "googleworkspace/cli/gws-chat-send", "googleworkspace/cli/gws-gmail",
    "googleworkspace/cli/gws-gmail-forward", "googleworkspace/cli/gws-gmail-read",
    "googleworkspace/cli/gws-gmail-reply", "googleworkspace/cli/gws-gmail-reply-all",
    "googleworkspace/cli/gws-gmail-send", "googleworkspace/cli/gws-gmail-triage",
    "googleworkspace/cli/gws-gmail-watch", "googleworkspace/cli/gws-meet",
    "googleworkspace/cli/gws-workflow-file-announce", "googleworkspace/cli/gws-workflow-standup-report",
    "googleworkspace/cli/gws-workflow-weekly-digest", "googleworkspace/cli/persona-customer-support",
    "googleworkspace/cli/recipe-batch-invite-to-event", "googleworkspace/cli/recipe-create-gmail-filter",
    "googleworkspace/cli/recipe-create-meet-space", "googleworkspace/cli/recipe-create-vacation-responder",
    "googleworkspace/cli/recipe-draft-email-from-doc", "googleworkspace/cli/recipe-email-drive-link",
    "googleworkspace/cli/recipe-forward-labeled-emails", "googleworkspace/cli/recipe-label-and-archive-emails",
    "googleworkspace/cli/recipe-review-meet-participants", "googleworkspace/cli/recipe-save-email-attachments",
    "googleworkspace/cli/recipe-send-team-announcement", "googleworkspace/cli/recipe-share-doc-and-notify",
    "googleworkspace/cli/recipe-share-event-materials", "cloudflare/skills/cloudflare-email-service",
  ],
  "writing-documents": [
    "anthropics/skills/doc-coauthoring", "anthropics/skills/docx", "anthropics/skills/pdf",
    "anthropics/skills/pptx", "anthropics/skills/internal-comms", "coreyhaines31/marketingskills/copywriting",
    "coreyhaines31/marketingskills/copy-editing", "coreyhaines31/marketingskills/content-strategy",
    "googleworkspace/cli/gws-docs", "googleworkspace/cli/gws-docs-write", "googleworkspace/cli/gws-slides",
    "googleworkspace/cli/recipe-create-doc-from-template", "googleworkspace/cli/recipe-create-presentation",
    "googleworkspace/cli/recipe-save-email-to-doc", "googleworkspace/cli/persona-content-creator",
    "huggingface/skills/huggingface-paper-publisher", "hashicorp/agent-skills/provider-docs",
  ],
  "design-media": [
    "anthropics/skills/algorithmic-art", "anthropics/skills/brand-guidelines", "anthropics/skills/canvas-design",
    "anthropics/skills/frontend-design", "anthropics/skills/slack-gif-creator", "anthropics/skills/theme-factory",
    "coreyhaines31/marketingskills/image", "coreyhaines31/marketingskills/video",
    "coreyhaines31/marketingskills/ad-creative",
    "google-labs-code/stitch-skills/code-to-design", "google-labs-code/stitch-skills/design-md",
    "google-labs-code/stitch-skills/extract-design-md", "google-labs-code/stitch-skills/generate-design",
    "google-labs-code/stitch-skills/manage-design-system", "google-labs-code/stitch-skills/upload-to-stitch",
    "google-labs-code/stitch-skills/remotion", "google-labs-code/stitch-skills/taste-design",
    "google-labs-code/stitch-skills/site-md", "expo/skills/expo-animation", "expo/skills/expo-design-system",
    "WordPress/agent-skills/wp-block-themes", "WordPress/agent-skills/wp-patterns", "WordPress/agent-skills/wpds",
  ],
  "software-development": [
    "anthropics/skills/claude-api", "anthropics/skills/mcp-builder", "anthropics/skills/web-artifacts-builder",
    "obra/superpowers/using-git-worktrees", "obra/superpowers/finishing-a-development-branch",
    "coreyhaines31/marketingskills/free-tools", "coreyhaines31/marketingskills/site-architecture",
    "googleworkspace/cli/gws-script", "googleworkspace/cli/gws-script-push",
    "huggingface/skills/huggingface-gradio", "google-labs-code/stitch-skills/react-components",
    "google-labs-code/stitch-skills/react-vite-dashboard", "google-labs-code/stitch-skills/shadcn-ui",
    "google-labs-code/stitch-skills/extract-static-html", "stripe/ai/stripe-apps", "stripe/ai/stripe-docs",
    "hashicorp/agent-skills/new-terraform-provider",
    "hashicorp/agent-skills/provider-actions", "hashicorp/agent-skills/provider-configuration",
    "hashicorp/agent-skills/provider-ephemeral-resources", "hashicorp/agent-skills/provider-framework-migration",
    "hashicorp/agent-skills/provider-resources", "WordPress/agent-skills/blueprint",
    "WordPress/agent-skills/wordpress-router", "WordPress/agent-skills/wp-abilities-api",
    "WordPress/agent-skills/wp-ability-development", "WordPress/agent-skills/wp-block-development",
    "WordPress/agent-skills/wp-env", "WordPress/agent-skills/wp-interactivity-api",
    "WordPress/agent-skills/wp-playground", "WordPress/agent-skills/wp-plugin-development",
    "WordPress/agent-skills/wp-rest-api", "WordPress/agent-skills/wp-wpcli-and-ops",
  ],
  "testing-review": [
    "anthropics/skills/webapp-testing", "obra/superpowers/test-driven-development",
    "obra/superpowers/systematic-debugging", "obra/superpowers/requesting-code-review",
    "obra/superpowers/receiving-code-review", "obra/superpowers/verification-before-completion",
    "microsoft/playwright-cli/playwright-cli", "expo/skills/eas-observe", "expo/skills/eas-simulator",
    "cloudflare/skills/web-perf", "cloudflare/skills/workers-profiling",
    "hashicorp/agent-skills/provider-test-patterns", "hashicorp/agent-skills/run-acceptance-tests",
    "hashicorp/agent-skills/terraform-test", "WordPress/agent-skills/wp-abilities-audit",
    "WordPress/agent-skills/wp-abilities-verify", "WordPress/agent-skills/wp-performance",
    "WordPress/agent-skills/wp-phpstan", "WordPress/agent-skills/wp-plugin-directory-guidelines",
    "WordPress/agent-skills/wp-project-triage",
  ],
  "ai-automation": [
    "anthropics/skills/skill-creator", "anthropics/skills/academy-guide", "anthropics/skills/discernment-nudge",
    "obra/superpowers/writing-skills", "obra/superpowers/using-superpowers", "obra/superpowers/diagnosing-superpowers",
    "obra/superpowers/dispatching-parallel-agents", "obra/superpowers/subagent-driven-development",
    "coreyhaines31/marketingskills/marketing-loops",
    "googleworkspace/cli/gws-events", "googleworkspace/cli/gws-events-subscribe",
    "googleworkspace/cli/gws-events-renew", "googleworkspace/cli/gws-workflow",
    "googleworkspace/cli/recipe-watch-drive-changes",
    "huggingface/skills/huggingface-tool-builder", "google-labs-code/stitch-skills/enhance-prompt",
    "google-labs-code/stitch-skills/stitch-loop", "cloudflare/skills/agents-sdk",
  ],
  "research-planning": [
    "stripe/ai/stripe-directory",
    "obra/superpowers/brainstorming", "obra/superpowers/writing-plans", "obra/superpowers/executing-plans",
    "coreyhaines31/marketingskills/customer-research", "coreyhaines31/marketingskills/competitor-profiling",
    "coreyhaines31/marketingskills/reverse-engineer-marketing", "coreyhaines31/marketingskills/marketing-council",
    "coreyhaines31/marketingskills/marketing-ideas", "coreyhaines31/marketingskills/marketing-plan",
    "coreyhaines31/marketingskills/marketing-psychology", "coreyhaines31/marketingskills/product-marketing",
    "googleworkspace/cli/gws-workflow-meeting-prep", "googleworkspace/cli/persona-project-manager",
    "googleworkspace/cli/persona-researcher", "googleworkspace/cli/recipe-plan-weekly-schedule",
    "googleworkspace/cli/recipe-post-mortem-setup", "huggingface/skills/huggingface-papers",
  ],
  "data-analytics": [
    "anthropics/skills/xlsx", "coreyhaines31/marketingskills/analytics", "coreyhaines31/marketingskills/attribution",
    "coreyhaines31/marketingskills/conversion-tracking", "coreyhaines31/marketingskills/ab-testing",
    "googleworkspace/cli/gws-sheets", "googleworkspace/cli/gws-sheets-read",
    "googleworkspace/cli/gws-sheets-append", "googleworkspace/cli/gws-forms",
    "googleworkspace/cli/recipe-backup-sheet-as-csv", "googleworkspace/cli/recipe-collect-form-responses",
    "googleworkspace/cli/recipe-compare-sheet-tabs", "googleworkspace/cli/recipe-copy-sheet-for-new-month",
    "googleworkspace/cli/recipe-create-expense-tracker", "googleworkspace/cli/recipe-create-feedback-form",
    "googleworkspace/cli/recipe-generate-report-from-sheet", "googleworkspace/cli/recipe-sync-contacts-to-sheet",
    "huggingface/skills/huggingface-datasets", "expo/skills/eas-update-insights", "cloudflare/skills/basin",
    "stripe/ai/stripe-bfcm-dashboard",
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
    "googleworkspace/cli/persona-sales-ops", "googleworkspace/cli/recipe-log-deal-update",
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
  "office-productivity": /\b(calendar scheduling|task lists?|workspace administration)\b/i,
  "team-communication": /\b(email replies|meeting invitations|team announcements?)\b/i,
  "cloud-infrastructure": /\b(infrastructure as code|cloud deployment|terraform|cloud hosting)\b/i,
  "mobile-development": /\b(react native|native mobile apps?|expo router)\b/i,
  "machine-learning": /\b(model training|machine learning|fine.tuning|model evaluation)\b/i,
  "databases": /\b(postgres|database queries|database schema)\b/i,
  "payments-billing": /\b(payment processing|payment integrations?|billing integration)\b/i,
  "identity-access": /\b(access management|identity verification|bot verification)\b/i,
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
