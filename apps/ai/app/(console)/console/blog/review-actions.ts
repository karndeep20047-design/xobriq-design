"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function snapshotRevision(
  admin: ReturnType<typeof createAdminClient>,
  postId: string,
  changedBy: string,
  note: string
) {
  const { data: snap } = await admin
    .from("blog_posts").select("*").eq("id", postId).single();
  if (snap) {
    await admin.from("blog_revisions").insert({
      post_id: postId, snapshot: snap,
      changed_by: changedBy, change_note: note,
    });
  }
}

// ─── Approve ────────────────────────────────────────────────────────
export async function approvePostAction(postId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_review");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts").select("title, status").eq("id", postId).single();
  if (!post) return { ok: false, error: "Post not found" };
  if (post.status !== "in_review") {
    return { ok: false, error: "Post must be in review to approve" };
  }

  await admin.from("blog_posts")
    .update({ status: "approved", reviewer_id: staff.id })
    .eq("id", postId);

  await snapshotRevision(admin, postId, staff.id, "Approved");
  await logAudit({
    actor_id: staff.id, actor_email: staff.email,
    action: "blog.approved",
    resource_type: "blog_post", resource_id: postId,
    metadata: { title: post.title },
  });

  revalidatePath("/console/blog");
  revalidatePath("/console/blog/" + postId);
  return { ok: true };
}

// ─── Request changes ────────────────────────────────────────────────
const RequestChangesSchema = z.object({
  post_id: z.string().uuid(),
  feedback: z.string().min(3).max(2000),
});

export async function requestChangesAction(input: z.infer<typeof RequestChangesSchema>) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_review");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const parsed = RequestChangesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts").select("title, status").eq("id", parsed.data.post_id).single();
  if (!post) return { ok: false, error: "Post not found" };

  await admin.from("blog_review_comments").insert({
    post_id: parsed.data.post_id,
    author_id: staff.id,
    body: parsed.data.feedback,
    resolved: false,
  });

  await admin.from("blog_posts")
    .update({ status: "changes_requested", reviewer_id: staff.id })
    .eq("id", parsed.data.post_id);

  await snapshotRevision(admin, parsed.data.post_id, staff.id, "Changes requested");
  await logAudit({
    actor_id: staff.id, actor_email: staff.email,
    action: "blog.changes_requested",
    resource_type: "blog_post", resource_id: parsed.data.post_id,
    metadata: { title: post.title, feedback: parsed.data.feedback.slice(0, 200) },
  });

  revalidatePath("/console/blog");
  revalidatePath("/console/blog/" + parsed.data.post_id);
  return { ok: true };
}

// ─── Publish ────────────────────────────────────────────────────────
export async function publishPostAction(postId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_review");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts").select("title, slug, status, content_html").eq("id", postId).single();
  if (!post) return { ok: false, error: "Post not found" };
  if (post.status === "published") return { ok: false, error: "Already published" };
  if (!post.content_html || post.content_html.length < 20) {
    return { ok: false, error: "Add some content first" };
  }

  await admin.from("blog_posts").update({
    status: "published",
    published_at: new Date().toISOString(),
    reviewer_id: staff.id,
  }).eq("id", postId);

  await snapshotRevision(admin, postId, staff.id, "Published");
  await logAudit({
    actor_id: staff.id, actor_email: staff.email,
    action: "blog.published",
    resource_type: "blog_post", resource_id: postId,
    metadata: { title: post.title, slug: post.slug },
  });

  revalidatePath("/console/blog");
  revalidatePath("/console/blog/" + postId);
  revalidatePath("/blog");
  revalidatePath("/blog/" + post.slug);
  return { ok: true };
}

// ─── Unpublish ──────────────────────────────────────────────────────
export async function unpublishPostAction(postId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_review");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts").select("title, slug").eq("id", postId).single();
  if (!post) return { ok: false, error: "Post not found" };

  await admin.from("blog_posts")
    .update({ status: "archived", published_at: null })
    .eq("id", postId);

  await snapshotRevision(admin, postId, staff.id, "Unpublished");
  await logAudit({
    actor_id: staff.id, actor_email: staff.email,
    action: "blog.unpublished",
    resource_type: "blog_post", resource_id: postId,
    metadata: { title: post.title },
  });

  revalidatePath("/console/blog");
  revalidatePath("/console/blog/" + postId);
  revalidatePath("/blog");
  revalidatePath("/blog/" + post.slug);
  return { ok: true };
}

// ─── Comment (add) ──────────────────────────────────────────────────
const AddCommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export async function addCommentAction(input: z.infer<typeof AddCommentSchema>) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_write");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const parsed = AddCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const admin = createAdminClient();
  await admin.from("blog_review_comments").insert({
    post_id: parsed.data.post_id,
    author_id: staff.id,
    body: parsed.data.body,
    resolved: false,
  });

  await logAudit({
    actor_id: staff.id, actor_email: staff.email,
    action: "blog.comment_added",
    resource_type: "blog_post", resource_id: parsed.data.post_id,
  });

  revalidatePath("/console/blog/" + parsed.data.post_id);
  return { ok: true };
}

// ─── Comment (toggle resolved) ──────────────────────────────────────
export async function toggleCommentResolvedAction(commentId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_write");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: comment } = await admin
    .from("blog_review_comments").select("post_id, resolved").eq("id", commentId).single();
  if (!comment) return { ok: false, error: "Not found" };

  await admin.from("blog_review_comments")
    .update({ resolved: !comment.resolved })
    .eq("id", commentId);

  revalidatePath("/console/blog/" + comment.post_id);
  return { ok: true };
}

// ─── Restore revision ───────────────────────────────────────────────
export async function restoreRevisionAction(revisionId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_review");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: revision } = await admin
    .from("blog_revisions").select("post_id, snapshot").eq("id", revisionId).single();
  if (!revision) return { ok: false, error: "Revision not found" };

  const snap = revision.snapshot as any;

  await snapshotRevision(admin, revision.post_id, staff.id, "Before restore");

  await admin.from("blog_posts").update({
    title: snap.title,
    excerpt: snap.excerpt,
    content_json: snap.content_json,
    content_html: snap.content_html,
    cover_image_url: snap.cover_image_url,
    cover_image_alt: snap.cover_image_alt,
    category_id: snap.category_id,
    tags: snap.tags,
    seo_title: snap.seo_title,
    seo_description: snap.seo_description,
  }).eq("id", revision.post_id);

  await logAudit({
    actor_id: staff.id, actor_email: staff.email,
    action: "blog.revision_restored",
    resource_type: "blog_post",
    resource_id: revision.post_id,
    metadata: { revision_id: revisionId },
  });

  revalidatePath("/console/blog/" + revision.post_id);
  return { ok: true };
}
