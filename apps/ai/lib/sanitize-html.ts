import sanitizeHtml from "sanitize-html";

// Mirrors exactly what components/console/blog/TiptapEditor.tsx's schema
// (StarterKit + Link + Image + Typography) can ever produce. Anything else
// — <script>, event handler attributes, javascript: URIs, iframes, etc. —
// is stripped. Applied both on save (console/blog/actions.ts) and on render
// (public blog page) so a single write path isn't the only thing standing
// between untrusted HTML and every visitor's browser.
//
// Uses `sanitize-html` (parse5-based, no DOM) rather than a jsdom-backed
// sanitizer — jsdom is heavy and a common source of failures in serverless
// deployments (bundle size, missing Node APIs at runtime) even when it
// builds and runs fine locally.
const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "s", "strike",
  "code", "pre", "ul", "ol", "li", "blockquote",
  "hr", "br", "a", "img",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel", "class"],
  img: ["src", "alt", "class"],
  "*": ["class"],
};

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
  });
}
