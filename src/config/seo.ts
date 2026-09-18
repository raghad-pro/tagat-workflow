import type { Locale } from "@/i18n/config";

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * The canonical public origin. Set `NEXT_PUBLIC_SITE_URL` per deployment;
 * everything that needs an absolute URL — canonical links, Open Graph images,
 * the sitemap, JSON-LD — derives from this one value.
 */
export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.workflownets.com"
);

export const SITE_NAME = "Workflow";

/** Only the landing page (`LANDING_PATHS` in `i18n/config`) is public; everything behind sign-in is `noindex`. */
export const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/kpis",
  "/companies",
  "/company-requests",
  "/clients",
  "/contracts",
  "/currencies",
  "/wallets",
  "/wallet-transactions",
  "/invoices",
  "/payments",
  "/projects",
  "/tasks",
  "/sprints",
  "/timesheets",
  "/developments",
  "/data-import",
  "/conversations",
  "/meetings",
  "/employees",
  "/roles",
  "/access",
  "/profile",
  "/settings",
  "/salaries",
  "/login",
  "/register",
  "/forgot-password",
  "/verify",
  "/api",
  "/backend-api",
] as const;

export const SEO_COPY: Record<
  Locale,
  { title: string; description: string; keywords: string[]; ogLocale: string }
> = {
  en: {
    title: "Workflow — Project & Team Management Platform",
    description:
      "Workflow is the command center for agile teams: plan projects, run sprints, track tasks and timesheets, manage clients, invoices and payments, and collaborate in one place.",
    keywords: [
      "project management software",
      "team collaboration platform",
      "task management",
      "sprint planning",
      "timesheets",
      "invoicing",
      "agile teams",
      "workflow management",
    ],
    ogLocale: "en_US",
  },
  ar: {
    title: "ووركفلو — منصة إدارة المشاريع والفرق",
    description:
      "ووركفلو مركز القيادة لفرق العمل المرنة: خطّط المشاريع، أدر السبرنتات والمهام وسجلات الوقت، وتابع العملاء والفواتير والمدفوعات، وتعاون مع فريقك من مكانٍ واحد.",
    keywords: [
      "برنامج إدارة المشاريع",
      "منصة تعاون الفرق",
      "إدارة المهام",
      "تخطيط السبرنت",
      "سجلات الوقت",
      "الفواتير",
      "فرق العمل المرنة",
    ],
    ogLocale: "ar_AR",
  },
};
