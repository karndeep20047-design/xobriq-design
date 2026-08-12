import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { corsHeaders as sharedCorsHeaders } from "@/lib/cors";

// Reuses the shared allowlist (lib/cors.ts) instead of its own drifting
// copy — this route previously had its own inline ALLOWED_ORIGINS missing
// the Vercel-preview and xobriq-ai-psi entries the shared list has. Only
// the extra Cache-Control header (this route's own caching behavior, not
// a security concern) stays local.
function corsHeaders(origin: string | null) {
  return {
    ...sharedCorsHeaders(origin, "GET, OPTIONS"),
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
  const slug = searchParams.get("slug");

  const admin = createAdminClient();

  if (slug) {
    const { data } = await admin
      .from("blog_posts")
      .select("id, slug, title, excerpt, content_html, cover_image_url, cover_image_alt, published_at, tags, seo_title, seo_description, blog_categories(name, slug, color)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return NextResponse.json({ post: data }, { headers });
  }

  let query = admin
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, published_at, tags, blog_categories(name, slug, color)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category && category !== "All") {
    const { data: cat } = await admin
      .from("blog_categories")
      .select("id")
      .eq("name", category)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data } = await query;
  return NextResponse.json({ posts: data || [] }, { headers });
}
