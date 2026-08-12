// apps/ai/lib/email/routing.ts
// Decides which mailbox handles an inquiry.
//
// Inquiry mail (send-inquiry-mails.ts) is sent FROM the routed mailbox itself
// (sales@/hr@/info@) — confirmed working for all three via a live Graph
// app-only send test. Auth mail (password reset, email verification) has no
// department to route by, so it always sends from SENDER_ADDRESS below.

export type MailboxRoute = "sales" | "info" | "hr" | "partnerships";

// Default sender for mail with no department — auth emails, and any inquiry
// that routes to "info".
export const SENDER_ADDRESS = "info@xobriq.com";

// Address emails are sent TO — routed based on inquiry type
export const MAILBOX = {
  sales: "sales@xobriq.com",
  info: "info@xobriq.com",
  hr: "hr@xobriq.com",
  partnerships: "partnerships@xobriq.com",
} as const;

// Callers pass this as `type` purely to steer routing/sending — it's never
// persisted as the inquiries.type column value (that stays "contact" so the
// existing DB check constraint isn't touched). Checked before the HR keyword
// sniff below since a Key Expert application's message contains "apply",
// which would otherwise match HR_KEYWORDS.
const CONSULTANT_APPLICATION_TYPE = "consultant_application";

const SALES_TYPES = new Set([
  "demo_request",
  "pricing_inquiry",
  "discovery_call",
  "partnership",
]);

const SALES_INTERESTS = new Set([
  "guard",
  "agentic",
  "cloud",
  "consult",
  "cyber",
]);

// There is no dedicated "career"/"job_application" inquiry `type` in the
// schema — every submission form (contact, careers, the public API) uses the
// same handful of `type` values, none of which mean "this is a job
// application". So HR routing can't key off `type` the way sales routing
// does; it has to sniff the free-text `message` for these keywords instead.
// If you ever add a real `career` type, prefer that over growing this regex.
const HR_KEYWORDS = /careers?|hiring|job|internship|apply|talent|recruit/i;

/**
 * Decide which mailbox should receive an inquiry.
 * Rules (in order — first match wins, so HR always takes priority even if
 * `type`/`interest` would otherwise also match a sales rule):
 *  1. HR keywords in message → hr@
 *  2. Type is a sales pipeline stage → sales@
 *  3. Interest is a product line → sales@
 *  4. Interested products selected → sales@
 *  5. Everything else → info@
 */
export function routeInquiry(input: {
  type?: string | null;
  interest?: string | null;
  message?: string | null;
  interested_products?: string[] | null;
}): { mailbox: MailboxRoute; address: string } {
  const message = (input.message || "").toLowerCase();

  if (input.type === CONSULTANT_APPLICATION_TYPE) {
    return { mailbox: "partnerships", address: MAILBOX.partnerships };
  }

  if (HR_KEYWORDS.test(message)) {
    return { mailbox: "hr", address: MAILBOX.hr };
  }

  if (input.type && SALES_TYPES.has(input.type)) {
    return { mailbox: "sales", address: MAILBOX.sales };
  }

  if (input.interest && SALES_INTERESTS.has(input.interest)) {
    return { mailbox: "sales", address: MAILBOX.sales };
  }

  if (input.interested_products && input.interested_products.length > 0) {
    return { mailbox: "sales", address: MAILBOX.sales };
  }

  return { mailbox: "info", address: MAILBOX.info };
}

export type InquiryDepartment = "hr" | "sales" | "general" | "partnerships";

/**
 * Classifies an inquiry into a department for console visibility filtering.
 * Derived from routeInquiry() so email routing and console access can never
 * drift apart. "partnerships" is its own department (not folded into "hr" or
 * "sales") because Expert Roster applications are meant to be visible to
 * both HR and sales/marketing in the console — see
 * inquiryDepartmentsForRole() in lib/session-types.ts for who gets it.
 */
export function classifyDepartment(input: Parameters<typeof routeInquiry>[0]): InquiryDepartment {
  const route = routeInquiry(input);
  if (route.mailbox === "partnerships") return "partnerships";
  if (route.mailbox === "hr") return "hr";
  if (route.mailbox === "sales") return "sales";
  return "general";
}
