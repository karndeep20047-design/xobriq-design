// apps/ai/lib/email/shell.ts
// Shared branding, escaping, and HTML shell reused by every email template.
//
// Unlike the rest of the app (React/JSX, which escapes interpolated values
// automatically), these templates are built as raw HTML strings — there's no
// framework safety net here. Every template file is responsible for calling
// escapeHtml() on any user-supplied value (name, message, company, etc.)
// before it goes into the string; renderEmailShell() below does not escape
// `bodyHtml` for you, since by the time it's called that HTML is expected to
// already be safe to inline as-is.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Same as escapeHtml(), but also turns newlines into <br> so multi-line
// content (composed inquiry messages, CV summaries) survives in email
// clients that ignore `white-space: pre-wrap` — Gmail's web/mobile renderers
// in particular strip it, collapsing every line onto one run-on paragraph
// even though the same CSS works fine in the console (a real browser).
export function escapeHtmlMultiline(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br>");
}

export const BRAND_NAME = "XOBRIQ";
export const BRAND_PRIMARY = "#006684";
export const BRAND_PRIMARY_DARK = "#005570";
export const COMPANY_ADDRESS =
  "Xobriq Technologies · GTC Tower, 24th Floor, Westlands, Nairobi";

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

export function emailButton(href: string, label: string): string {
  return (
    '<a href="' + href + '" target="_blank" rel="noopener noreferrer" ' +
    'style="display:inline-block;background:' + BRAND_PRIMARY + ';color:#ffffff;' +
    'padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">' +
    label +
    "</a>"
  );
}

export function emailUrlBox(url: string): string {
  return (
    '<div style="font-size:12px;color:' + BRAND_PRIMARY + ';word-break:break-all;' +
    'font-family:monospace;background:#f8fafc;padding:12px;border-radius:6px;">' +
    url +
    "</div>"
  );
}

type ShellOptions = {
  title: string;
  bodyHtml: string;
  footerNote?: string;
};

/**
 * Wraps template-specific body markup in the shared document/card/footer
 * chrome so every outgoing email renders with consistent branding.
 */
export function renderEmailShell({ title, bodyHtml, footerNote }: ShellOptions): string {
  return (
    "<!doctype html><html><head><meta charset=\"UTF-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
    "<title>" + title + "</title></head>" +
    "<body style=\"margin:0;padding:0;font-family:" + FONT_STACK + ";background:#f8fafc;\">" +
    '<div style="max-width:560px;margin:0 auto;padding:24px;">' +
    '<div style="background:#ffffff;border-radius:12px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">' +
    '<div style="font-size:14px;color:' + BRAND_PRIMARY + ';font-weight:700;letter-spacing:2px;text-transform:uppercase;">' + BRAND_NAME + "</div>" +
    bodyHtml +
    '<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">' + COMPANY_ADDRESS + "</div>" +
    (footerNote
      ? '<div style="margin-top:12px;font-size:11px;color:#94a3b8;">' + footerNote + "</div>"
      : "") +
    "</div>" +
    "</div></body></html>"
  );
}
