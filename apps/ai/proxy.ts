import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/console",
  "/docs/cli",
  "/docs/playground",
  "/docs/api-keys",
  "/docs/integrations",
];

// Public routes that must NEVER be intercepted. /api is deliberately NOT
// here — API routes still need this middleware to run so a long-lived SPA
// session (the KYC dashboard rarely does a real page navigation) gets its
// Supabase access token refreshed here too. Without it, only real page loads
// ever refreshed the session, so every fetch()-based /api/* call started
// failing with 401 once the access token expired (~1hr), with no way to
// recover short of a hard page reload — a real production incident this
// fixes. Safe for Bearer-token API-key callers too: isProtected is false for
// /api (not in PROTECTED_PREFIXES) and isDocumentRequest is false for a
// fetch() call, so the redirect-to-login block below never fires for them —
// they just get a (harmless) session-refresh attempt alongside their normal
// per-request auth in requireKycClientAccess().
const PUBLIC_ALWAYS = [
  "/auth/callback",
  "/_next",
  "/favicon",
];

// Supabase project this app talks to directly from the browser (session
// refresh, storage-hosted images). Keep in sync with NEXT_PUBLIC_SUPABASE_URL.
const SUPABASE_ORIGIN = "https://ffxzstaufbdrptapuunc.supabase.co";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth for public-always routes
  if (PUBLIC_ALWAYS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // One CSP nonce per request, generated with the Edge-runtime Web Crypto
  // API (this file runs on the Edge runtime — no node:crypto here).
  // Forwarded via a request header so app/layout.tsx can read it and stamp
  // it onto the one inline <script> this app renders (the theme-flash
  // prevention script) — without a matching nonce, that tag would be
  // blocked the moment the policy below moves from Report-Only to enforced.
  const nonce = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Only redirect real top-level page navigations. `/dashboard/xobriqKYC/*`
  // reverse-proxies a whole separate SPA (apps/kyc) whose own JS chunks,
  // vite/node_modules dev-server internals, and client-side data fetches all
  // share this same protected prefix — none of those are "the page", and
  // redirecting them to /login mid-flight hands the browser an HTML page
  // where it expected JS/JSON, which breaks module parsing (or hydration)
  // and leaves the whole SPA inert. Sec-Fetch-Dest: document is set by every
  // modern browser only for actual address-bar/link navigations, never for
  // <script>/fetch/import() requests — so this scopes the redirect to real
  // page loads while leaving sub-resource requests to fail on their own
  // per-request auth (requireKycClientAccess() etc.), same as the
  // "not a substitute for per-page checks" contract already documented above.
  const isDocumentRequest = req.headers.get("sec-fetch-dest") === "document";

  if (isProtected && !user && isDocumentRequest) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Static headers (X-Frame-Options, nosniff, Referrer-Policy,
  // Permissions-Policy, HSTS) live in next.config.ts's headers() now, not
  // here — this file only sets what genuinely needs per-request computation
  // (the auth cookie check above, the nonce below).
  //
  // Content-Security-Policy — Report-Only for now (violations logged at
  // app/api/csp-report). This cannot block or break anything today; it only
  // reports what *would* be blocked. Switching to the enforcing
  // `Content-Security-Policy` header is a deliberate later step, made once
  // reports have been watched for a while and show nothing legitimate
  // getting flagged — not something to bundle into this change.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://connect.facebook.net`,
    // Not nonce-scoping style-src: this app has inline style={{...}} props
    // scattered across components (dynamic widths, gradient positions,
    // etc). Auditing/nonce-ing every one is a large effort for a smaller
    // risk category than script injection — a deliberate tradeoff, not an
    // oversight. Revisit if this policy ever needs to get stricter.
    `style-src 'self' 'unsafe-inline'`,
    // https://www.facebook.com is the Meta Pixel's <noscript> fallback
    // (a plain 1x1 tracking <img>) and its own beacon/fetch calls.
    `img-src 'self' data: https://images.unsplash.com https://www.facebook.com ${SUPABASE_ORIGIN}`,
    `connect-src 'self' https://www.facebook.com ${SUPABASE_ORIGIN}`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `report-uri /api/csp-report`,
  ].join("; ");
  res.headers.set("Content-Security-Policy-Report-Only", csp);

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|xobriq-logo.png|images/).*)",
  ],
};