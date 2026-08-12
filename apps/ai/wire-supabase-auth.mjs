import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const LT = String.fromCharCode(60);
const GT = String.fromCharCode(62);

const w = (p, lines) => {
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(p, lines.join("\n"), "utf8");
  console.log("OK", p);
};

// ═══════════════════════════════════════════════════════════════════════
// 1. app/(auth)/actions.ts — real Supabase server actions
// ═══════════════════════════════════════════════════════════════════════
w("app/(auth)/actions.ts", [
  '"use server";',
  '',
  'import { redirect } from "next/navigation";',
  'import { revalidatePath } from "next/cache";',
  'import { z } from "zod";',
  'import { createClient } from "@/lib/supabase/server";',
  '',
  'const LoginSchema = z.object({',
  '  email: z.string().email().max(200),',
  '  password: z.string().min(1).max(200),',
  '  website: z.string().optional(),',
  '});',
  '',
  'const RegisterSchema = z.object({',
  '  fullName: z.string().min(2).max(120),',
  '  email: z.string().email().max(200),',
  '  password: z.string().min(12).max(200),',
  '  website: z.string().optional(),',
  '});',
  '',
  'const ResetSchema = z.object({',
  '  email: z.string().email().max(200),',
  '  website: z.string().optional(),',
  '});',
  '',
  'export type ActionResult = {',
  '  ok?: boolean;',
  '  error?: string;',
  '  fieldErrors?: Record' + LT + 'string, string' + GT + ';',
  '};',
  '',
  'export async function loginAction(formData: FormData) {',
  '  const raw = Object.fromEntries(formData.entries());',
  '  if (typeof raw.website === "string" && raw.website.length ' + GT + ' 0) return;',
  '',
  '  const parsed = LoginSchema.safeParse(raw);',
  '  if (!parsed.success) return;',
  '',
  '  const supabase = await createClient();',
  '  const { error } = await supabase.auth.signInWithPassword({',
  '    email: parsed.data.email,',
  '    password: parsed.data.password,',
  '  });',
  '',
  '  if (error) {',
  '    return { ok: false, error: "Invalid email or password" };',
  '  }',
  '',
  '  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";',
  '  redirect(redirectTo);',
  '}',
  '',
  'export async function registerAction(formData: FormData): Promise' + LT + 'ActionResult' + GT + ' {',
  '  const raw = Object.fromEntries(formData.entries());',
  '  if (typeof raw.website === "string" && raw.website.length ' + GT + ' 0) return { ok: true };',
  '',
  '  const parsed = RegisterSchema.safeParse(raw);',
  '  if (!parsed.success) {',
  '    const fieldErrors: Record' + LT + 'string, string' + GT + ' = {};',
  '    parsed.error.issues.forEach((i) => {',
  '      const path = i.path.join(".");',
  '      if (!fieldErrors[path]) fieldErrors[path] = i.message;',
  '    });',
  '    return { ok: false, error: "Please fix the errors below", fieldErrors };',
  '  }',
  '',
  '  const supabase = await createClient();',
  '  const { error } = await supabase.auth.signUp({',
  '    email: parsed.data.email,',
  '    password: parsed.data.password,',
  '    options: {',
  '      data: { full_name: parsed.data.fullName },',
  '      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,',
  '    },',
  '  });',
  '',
  '  if (error) {',
  '    return { ok: false, error: error.message };',
  '  }',
  '',
  '  return { ok: true };',
  '}',
  '',
  'export async function resetPasswordRequestAction(formData: FormData): Promise' + LT + 'ActionResult' + GT + ' {',
  '  const raw = Object.fromEntries(formData.entries());',
  '  if (typeof raw.website === "string" && raw.website.length ' + GT + ' 0) return { ok: true };',
  '',
  '  const parsed = ResetSchema.safeParse(raw);',
  '  if (!parsed.success) return { ok: true };',
  '',
  '  const supabase = await createClient();',
  '  await supabase.auth.resetPasswordForEmail(parsed.data.email, {',
  '    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirectTo=/settings`,',
  '  });',
  '',
  '  return { ok: true };',
  '}',
  '',
  'export async function signInWithGoogle() {',
  '  const supabase = await createClient();',
  '  const { data } = await supabase.auth.signInWithOAuth({',
  '    provider: "google",',
  '    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },',
  '  });',
  '  if (data.url) redirect(data.url);',
  '}',
  '',
  'export async function signInWithMicrosoft() {',
  '  const supabase = await createClient();',
  '  const { data } = await supabase.auth.signInWithOAuth({',
  '    provider: "azure",',
  '    options: {',
  '      scopes: "email profile openid",',
  '      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,',
  '    },',
  '  });',
  '  if (data.url) redirect(data.url);',
  '}',
  '',
  'export async function logoutAction() {',
  '  const supabase = await createClient();',
  '  await supabase.auth.signOut();',
  '  revalidatePath("/", "layout");',
  '  redirect("/login");',
  '}',
]);

// ═══════════════════════════════════════════════════════════════════════
// 2. lib/supabase/server.ts
// ═══════════════════════════════════════════════════════════════════════
w("lib/supabase/server.ts", [
  'import { createServerClient } from "@supabase/ssr";',
  'import { cookies } from "next/headers";',
  '',
  'export async function createClient() {',
  '  const cookieStore = await cookies();',
  '',
  '  return createServerClient(',
  '    process.env.NEXT_PUBLIC_SUPABASE_URL!,',
  '    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,',
  '    {',
  '      cookies: {',
  '        getAll() {',
  '          return cookieStore.getAll();',
  '        },',
  '        setAll(cookiesToSet) {',
  '          try {',
  '            cookiesToSet.forEach(({ name, value, options }) =' + GT,
  '              cookieStore.set(name, value, options)',
  '            );',
  '          } catch {',
  '            // Server Components cannot set cookies; ignore',
  '          }',
  '        },',
  '      },',
  '    }',
  '  );',
  '}',
]);

// ═══════════════════════════════════════════════════════════════════════
// 3. lib/supabase/client.ts
// ═══════════════════════════════════════════════════════════════════════
w("lib/supabase/client.ts", [
  '"use client";',
  '',
  'import { createBrowserClient } from "@supabase/ssr";',
  '',
  'export function createClient() {',
  '  return createBrowserClient(',
  '    process.env.NEXT_PUBLIC_SUPABASE_URL!,',
  '    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!',
  '  );',
  '}',
]);

// ═══════════════════════════════════════════════════════════════════════
// 4. lib/supabase/admin.ts (service-role — server only)
// ═══════════════════════════════════════════════════════════════════════
w("lib/supabase/admin.ts", [
  'import { createClient as createAdminBase } from "@supabase/supabase-js";',
  '',
  '// Use for server-side operations that bypass RLS.',
  '// NEVER import this in Client Components.',
  'export function createAdminClient() {',
  '  return createAdminBase(',
  '    process.env.NEXT_PUBLIC_SUPABASE_URL!,',
  '    process.env.SUPABASE_SERVICE_ROLE_KEY!,',
  '    { auth: { autoRefreshToken: false, persistSession: false } }',
  '  );',
  '}',
]);

// ═══════════════════════════════════════════════════════════════════════
// 5. app/auth/callback/route.ts — OAuth handshake landing
// ═══════════════════════════════════════════════════════════════════════
w("app/auth/callback/route.ts", [
  'import { NextRequest, NextResponse } from "next/server";',
  'import { createClient } from "@/lib/supabase/server";',
  '',
  'export async function GET(req: NextRequest) {',
  '  const { searchParams, origin } = new URL(req.url);',
  '  const code = searchParams.get("code");',
  '  const redirectTo = searchParams.get("redirectTo") || "/dashboard";',
  '',
  '  if (code) {',
  '    const supabase = await createClient();',
  '    await supabase.auth.exchangeCodeForSession(code);',
  '  }',
  '',
  '  return NextResponse.redirect(new URL(redirectTo, origin));',
  '}',
]);

// ═══════════════════════════════════════════════════════════════════════
// 6. components/auth/SsoButtons.tsx — form-wrapped server-action buttons
// ═══════════════════════════════════════════════════════════════════════
w("components/auth/SsoButtons.tsx", [
  '"use client";',
  '',
  'import { signInWithGoogle, signInWithMicrosoft } from "@/app/(auth)/actions";',
  '',
  'type Layout = "stacked" | "side-by-side";',
  '',
  'export function SsoButtons({ layout = "stacked" }: { layout?: Layout }) {',
  '  const wrapperClass =',
  '    layout === "stacked"',
  '      ? "grid grid-cols-1 gap-3"',
  '      : "grid grid-cols-1 gap-3 sm:grid-cols-2";',
  '',
  '  return (',
  '    ' + LT + 'div className={wrapperClass}' + GT,
  '      ' + LT + 'form action={signInWithGoogle}' + GT,
  '        ' + LT + 'button',
  '          type="submit"',
  '          className="group flex w-full items-center justify-center gap-3 rounded-lg border border-enterprise-border bg-transparent px-4 py-2.5 text-fg transition hover:border-enterprise-border-strong hover:bg-white/[0.03]"',
  '        ' + GT,
  '          ' + LT + 'GoogleIcon /' + GT,
  '          ' + LT + 'span className="label-caps"' + GT + 'Continue with Google' + LT + '/span' + GT,
  '        ' + LT + '/button' + GT,
  '      ' + LT + '/form' + GT,
  '',
  '      ' + LT + 'form action={signInWithMicrosoft}' + GT,
  '        ' + LT + 'button',
  '          type="submit"',
  '          className="group flex w-full items-center justify-center gap-3 rounded-lg border border-enterprise-border bg-transparent px-4 py-2.5 text-fg transition hover:border-enterprise-border-strong hover:bg-white/[0.03]"',
  '        ' + GT,
  '          ' + LT + 'MicrosoftIcon /' + GT,
  '          ' + LT + 'span className="label-caps"' + GT + 'Microsoft Azure SSO' + LT + '/span' + GT,
  '        ' + LT + '/button' + GT,
  '      ' + LT + '/form' + GT,
  '    ' + LT + '/div' + GT,
  '  );',
  '}',
  '',
  'function GoogleIcon() {',
  '  return (',
  '    ' + LT + 'svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"' + GT,
  '      ' + LT + 'path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /' + GT,
  '      ' + LT + 'path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /' + GT,
  '      ' + LT + 'path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /' + GT,
  '      ' + LT + 'path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /' + GT,
  '    ' + LT + '/svg' + GT,
  '  );',
  '}',
  '',
  'function MicrosoftIcon() {',
  '  return (',
  '    ' + LT + 'svg className="h-5 w-5" viewBox="0 0 23 23" aria-hidden="true"' + GT,
  '      ' + LT + 'path d="M0 0h11v11H0z" fill="#F25022" /' + GT,
  '      ' + LT + 'path d="M12 0h11v11H12z" fill="#7FBA00" /' + GT,
  '      ' + LT + 'path d="M0 12h11v11H0z" fill="#00A4EF" /' + GT,
  '      ' + LT + 'path d="M12 12h11v11H12z" fill="#FFB900" /' + GT,
  '    ' + LT + '/svg' + GT,
  '  );',
  '}',
]);

console.log("");
console.log("Done. Now:");
console.log("  1. Verify apps/ai/.env.local has:");
console.log("     NEXT_PUBLIC_SUPABASE_URL=...");
console.log("     NEXT_PUBLIC_SUPABASE_ANON_KEY=...");
console.log("     SUPABASE_SERVICE_ROLE_KEY=...");
console.log("     NEXT_PUBLIC_APP_URL=http://localhost:3000");
console.log("");
console.log("  2. Install packages if you haven't:");
console.log("     npm install @supabase/supabase-js @supabase/ssr");
console.log("");
console.log("  3. Restart:");
console.log("     Remove-Item -Recurse -Force .next");
console.log("     npm run dev");