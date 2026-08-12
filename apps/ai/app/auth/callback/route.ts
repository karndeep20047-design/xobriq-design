import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const explicitRedirect = searchParams.get("redirectTo");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  // Build the redirect response FIRST so we can write cookies onto it
  const response = NextResponse.redirect(new URL("/console", origin));

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
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", origin));
  }

  // Determine destination
  let destination = "/dashboard";

  if (explicitRedirect && explicitRedirect.startsWith("/")) {
    destination = explicitRedirect;
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("xobriq_staff_role")
      .eq("id", data.user.id)
      .single();

    if (profile?.xobriq_staff_role) {
      destination = "/console";
    }
  }

  // Update the redirect URL — cookies are already attached
  const finalResponse = NextResponse.redirect(new URL(destination, origin));
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}