import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlogListClient } from "./BlogListClient";

export const metadata = { title: "Blog CMS — Xobriq Console" };

export default async function BlogListPage() {
  const { user: staff, access } = await requireStaffPermission("blog_write");
  const admin = createAdminClient();

  const isReviewer = access.isSuperAdmin || access.permissions.blog_review;

  let query = admin
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_image_url, status, author_id, published_at, scheduled_for, updated_at, view_count, category_id"
    )
    .order("updated_at", { ascending: false });

  if (!isReviewer) {
    query = query.or("author_id.eq." + staff.id + ",status.eq.published");
  }

  const { data: posts } = await query;

  const authorIds = Array.from(
    new Set((posts || []).map((p) => p.author_id).filter(Boolean))
  );

  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authorIds);
    (authors || []).forEach((a) => {
      authorMap[a.id] = a.full_name || a.email;
    });
  }

  return (
    <BlogListClient
      posts={(posts || []) as any}
      authorMap={authorMap}
      currentUserId={staff.id}
      isReviewer={isReviewer}
    />
  );
}
