"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sanitizeBlogHtml } from "@/lib/sanitize-html";

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// This same permission key repeats unchanged in every export below; it's
// not copy-paste drift, all of these actions genuinely share one boundary.
// ─── Create post ────────────────────────────────────────────────────
export async function createPostAction() {
  const { user: staff } = await requireStaffPermission("blog_write");
  const admin = createAdminClient();

  const draftTitle = "Untitled draft";
  const baseSlug = slugify(draftTitle) + "-" + Date.now().toString().slice(-6);

  const { data: post, error } = await admin
    .from("blog_posts")
    .insert({
      slug: baseSlug,
      title: draftTitle,
      content_json: {},
      content_html: "",
      status: "draft",
      author_id: staff.id,
    })
    .select("id")
    .single();

  if (error || !post) {
    return { ok: false, error: error?.message || "Failed" };
  }

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "blog.draft_created",
    resource_type: "blog_post",
    resource_id: post.id,
  });

  redirect("/console/blog/" + post.id);
}

// ─── Save draft (debounced) ─────────────────────────────────────────
const SaveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content_json: z.any().optional(),
  content_html: z.string().optional(),
  cover_image_url: z.string().optional(),
  cover_image_alt: z.string().max(200).optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  seo_title: z.string().max(80).optional(),
  seo_description: z.string().max(200).optional(),
  scheduled_for: z.string().nullable().optional(),
});

export async function savePostAction(
  input: z.infer<typeof SaveSchema>
) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_write");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user: staff, access } = ctx;

  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts")
    .select("author_id, status")
    .eq("id", parsed.data.id)
    .single();

  if (!post) return { ok: false, error: "Post not found" };

  const canWrite =
    access.isSuperAdmin || access.permissions.blog_review ||
    post.author_id === staff.id;
  if (!canWrite) return { ok: false, error: "You cannot edit this post" };

  const updates: Record<string, unknown> = {};

  if (parsed.data.title !== undefined) {
    updates.title = parsed.data.title;
    if (post.status === "draft") {
      updates.slug = slugify(parsed.data.title) + "-" + parsed.data.id.slice(0, 6);
    }
  }
  if (parsed.data.excerpt !== undefined) updates.excerpt = parsed.data.excerpt;
  if (parsed.data.content_json !== undefined) updates.content_json = parsed.data.content_json;
  if (parsed.data.content_html !== undefined) updates.content_html = sanitizeBlogHtml(parsed.data.content_html);
  if (parsed.data.cover_image_url !== undefined) updates.cover_image_url = parsed.data.cover_image_url;
  if (parsed.data.cover_image_alt !== undefined) updates.cover_image_alt = parsed.data.cover_image_alt;
  if (parsed.data.category_id !== undefined) updates.category_id = parsed.data.category_id;
  if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;
  if (parsed.data.seo_title !== undefined) updates.seo_title = parsed.data.seo_title;
  if (parsed.data.seo_description !== undefined) updates.seo_description = parsed.data.seo_description;
  if (parsed.data.scheduled_for !== undefined) updates.scheduled_for = parsed.data.scheduled_for;

  const { error } = await admin
    .from("blog_posts")
    .update(updates)
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ─── Submit for review ──────────────────────────────────────────────
export async function submitForReviewAction(postId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_write");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts")
    .select("title, status, author_id")
    .eq("id", postId)
    .single();

  if (!post) return { ok: false, error: "Post not found" };
  if (!post.title || post.title === "Untitled draft") {
    return { ok: false, error: "Add a title first" };
  }

  await admin
    .from("blog_posts")
    .update({ status: "in_review" })
    .eq("id", postId);

  // Snapshot
  const { data: snap } = await admin
    .from("blog_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (snap) {
    await admin.from("blog_revisions").insert({
      post_id: postId,
      snapshot: snap,
      changed_by: staff.id,
      change_note: "Submitted for review",
    });
  }

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "blog.submitted_for_review",
    resource_type: "blog_post",
    resource_id: postId,
    metadata: { title: post.title },
  });

  revalidatePath("/console/blog");
  return { ok: true };
}

// ─── Delete draft ───────────────────────────────────────────────────
export async function deletePostAction(postId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_write");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user: staff, access } = ctx;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts")
    .select("title, author_id, status")
    .eq("id", postId)
    .single();

  if (!post) return { ok: false, error: "Not found" };

  const canDelete =
    access.isSuperAdmin || access.permissions.blog_review ||
    (post.author_id === staff.id && post.status === "draft");

  if (!canDelete) return { ok: false, error: "You cannot delete this post" };

  await admin.from("blog_posts").delete().eq("id", postId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "blog.deleted",
    resource_type: "blog_post",
    resource_id: postId,
    metadata: { title: post.title, status: post.status },
  });

  revalidatePath("/console/blog");
  return { ok: true };
}

// ─── Upload cover image to Supabase Storage ─────────────────────────
export async function uploadCoverImageAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireStaffPermission("blog_write");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;

  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "No file" };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Max 4MB" };

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "png";
  const path = "covers/" + staff.id + "/" + Date.now() + "." + ext;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await admin.storage.from("blog-media").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { ok: false, error: error.message };

  const { data: url } = admin.storage.from("blog-media").getPublicUrl(path);
  return { ok: true, url: url.publicUrl };
}
