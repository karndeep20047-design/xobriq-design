import { notFound } from "next/navigation";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlogEditorClient } from "./BlogEditorClient";

export const metadata = { title: "Edit Post — Xobriq Console" };

export default async function BlogEditorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { user: staff, access } = await requireStaffPermission("blog_write");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts").select("*").eq("id", id).single();
  if (!post) notFound();

  const [
    { data: categories },
    { data: comments },
    { data: revisions },
  ] = await Promise.all([
    admin.from("blog_categories").select("*").order("name"),
    admin
      .from("blog_review_comments")
      .select("id, body, resolved, created_at, author_id")
      .eq("post_id", id)
      .order("created_at"),
    admin
      .from("blog_revisions")
      .select("id, change_note, created_at, changed_by")
      .eq("post_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const userIds = new Set<string>();
  (comments || []).forEach((c) => { if (c.author_id) userIds.add(c.author_id); });
  (revisions || []).forEach((r) => { if (r.changed_by) userIds.add(r.changed_by); });
  if (post.author_id) userIds.add(post.author_id);

  const { data: users } = userIds.size > 0
    ? await admin.from("profiles").select("id, full_name, email").in("id", Array.from(userIds))
    : { data: [] };

  const userMap: Record<string, string> = {};
  (users || []).forEach((u) => { userMap[u.id] = u.full_name || u.email; });

  const isReviewer = access.isSuperAdmin || access.permissions.blog_review;
  const isAuthor = post.author_id === staff.id;

  return (
    <BlogEditorClient
      post={post as any}
      categories={(categories || []) as any}
      comments={(comments || []) as any}
      revisions={(revisions || []) as any}
      userMap={userMap}
      isReviewer={isReviewer}
      isAuthor={isAuthor}
      currentUserId={staff.id}
    />
  );
}
