"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Send, Image as ImageIcon, X, Loader2,
  Check, MessageSquareWarning, Rocket, Archive,
} from "lucide-react";
import { TiptapEditor } from "@/components/console/blog/TiptapEditor";
import {
  CommentsPanel, RevisionsPanel,
} from "@/components/console/blog/ReviewPanel";
import {
  savePostAction, submitForReviewAction, uploadCoverImageAction,
} from "../actions";
import {
  approvePostAction, requestChangesAction,
  publishPostAction, unpublishPostAction,
} from "../review-actions";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_json: unknown;
  content_html: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  tags: string[];
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  scheduled_for: string | null;
  author_id: string;
};

type Category = { id: string; name: string; slug: string; color: string };
type Comment = {
  id: string;
  body: string;
  resolved: boolean;
  created_at: string;
  author_id: string | null;
};
type Revision = {
  id: string;
  change_note: string | null;
  created_at: string;
  changed_by: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

const STATUS_TONES: Record<string, string> = {
  draft: "bg-fg-subtle/15 text-fg-subtle",
  in_review: "bg-amber-500/15 text-amber-400",
  changes_requested: "bg-orange-500/15 text-orange-400",
  approved: "bg-enterprise-primary/15 text-enterprise-primary",
  published: "bg-emerald-500/15 text-emerald-400",
  archived: "bg-fg-subtle/10 text-fg-subtle",
};

export function BlogEditorClient(props: {
  post: Post;
  categories: Category[];
  comments: Comment[];
  revisions: Revision[];
  userMap: Record<string, string>;
  isReviewer: boolean;
  isAuthor: boolean;
  currentUserId: string;
}) {
  const post = props.post;
  const categories = props.categories;
  const comments = props.comments;
  const revisions = props.revisions;
  const userMap = props.userMap;
  const isReviewer = props.isReviewer;
  const isAuthor = props.isAuthor;
  const currentUserId = props.currentUserId;

  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [content, setContent] = useState<unknown>(post.content_json || {});
  const [contentHtml, setContentHtml] = useState(post.content_html || "");
  const [coverUrl, setCoverUrl] = useState(post.cover_image_url || "");
  const [categoryId, setCategoryId] = useState(post.category_id || "");
  const [tags, setTags] = useState((post.tags || []).join(", "));
  const [seoTitle, setSeoTitle] = useState(post.seo_title || "");
  const [seoDesc, setSeoDesc] = useState(post.seo_description || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadPending, startUpload] = useTransition();
  const [actionPending, startAction] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showRequestChanges, setShowRequestChanges] = useState(false);

  const canEdit =
    (isAuthor && ["draft", "changes_requested"].includes(post.status)) ||
    isReviewer;

  const canSubmit =
    canEdit && ["draft", "changes_requested"].includes(post.status);

  // Track current values so we can flush before actions
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentValuesRef = useRef({
    title, excerpt, content, contentHtml, coverUrl,
    categoryId, tags, seoTitle, seoDesc,
  });

  useEffect(() => {
    currentValuesRef.current = {
      title, excerpt, content, contentHtml, coverUrl,
      categoryId, tags, seoTitle, seoDesc,
    };
  });

  // Debounced auto-save
  useEffect(() => {
    if (!canEdit) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const r = await savePostAction({
        id: post.id,
        title,
        excerpt,
        content_json: content,
        content_html: contentHtml,
        cover_image_url: coverUrl,
        category_id: categoryId || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        seo_title: seoTitle,
        seo_description: seoDesc,
      });
      setSaveStatus(r.ok ? "saved" : "error");
      if (r.ok) setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    title, excerpt, content, contentHtml, coverUrl,
    categoryId, tags, seoTitle, seoDesc, canEdit, post.id,
  ]);

  // Flush pending save then run an action
  const flushAndRun = async (
    action: () => Promise<{ ok: boolean; error?: string }>
  ) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const cv = currentValuesRef.current;
    setSaveStatus("saving");
    const s = await savePostAction({
      id: post.id,
      title: cv.title,
      excerpt: cv.excerpt,
      content_json: cv.content,
      content_html: cv.contentHtml,
      cover_image_url: cv.coverUrl,
      category_id: cv.categoryId || null,
      tags: cv.tags.split(",").map((t) => t.trim()).filter(Boolean),
      seo_title: cv.seoTitle,
      seo_description: cv.seoDesc,
    });
    if (!s.ok) {
      setBanner({ type: "error", message: s.error || "Save failed" });
      return;
    }
    setSaveStatus("saved");
    const r = await action();
    if (!r.ok) {
      setBanner({ type: "error", message: r.error || "Action failed" });
    } else {
      window.location.href = "/console/blog";
    }
  };

  const handleUpload = (file: File) => {
    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadCoverImageAction(fd);
      if (r.ok && r.url) setCoverUrl(r.url);
      else setBanner({ type: "error", message: r.error || "Upload failed" });
    });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/console/blog"
              className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-bg-subtle"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-fg-muted">Editing</p>
                <span
                  className={
                    "rounded px-2 py-0.5 text-[10px] font-semibold " +
                    STATUS_TONES[post.status]
                  }
                >
                  {STATUS_LABELS[post.status]}
                </span>
              </div>
              <p className="text-xs text-fg-subtle">
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved ✓"
                  : saveStatus === "error"
                  ? "Save failed"
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canSubmit ? (
              <button
                onClick={() =>
                  startAction(() =>
                    flushAndRun(() => submitForReviewAction(post.id))
                  )
                }
                disabled={actionPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-3 py-1.5 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
              >
                <Send className="h-3 w-3" /> Submit for review
              </button>
            ) : null}

            {isReviewer && post.status === "in_review" ? (
              <>
                <button
                  onClick={() =>
                    startAction(() =>
                      flushAndRun(() => approvePostAction(post.id))
                    )
                  }
                  disabled={actionPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-3 py-1.5 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
                >
                  <Check className="h-3 w-3" /> Approve
                </button>
                <button
                  onClick={() => setShowRequestChanges(true)}
                  disabled={actionPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <MessageSquareWarning className="h-3 w-3" /> Request changes
                </button>
              </>
            ) : null}

            {isReviewer && post.status === "approved" ? (
              <button
                onClick={() =>
                  startAction(() =>
                    flushAndRun(() => publishPostAction(post.id))
                  )
                }
                disabled={actionPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <Rocket className="h-3 w-3" /> Publish
              </button>
            ) : null}

            {isReviewer && post.status === "published" ? (
              <button
                onClick={() => {
                  if (!confirm("Unpublish this post?")) return;
                  startAction(() =>
                    flushAndRun(() => unpublishPostAction(post.id))
                  );
                }}
                disabled={actionPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-xs font-semibold text-fg-muted hover:bg-bg-elevated disabled:opacity-50"
              >
                <Archive className="h-3 w-3" /> Unpublish
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {banner ? (
        <div className="mx-auto mt-4 max-w-7xl px-5 sm:px-6">
          <div
            className={
              "flex items-center justify-between rounded-lg border p-3 text-sm " +
              (banner.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200")
            }
          >
            <span>{banner.message}</span>
            <button onClick={() => setBanner(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {showRequestChanges ? (
        <RequestChangesDialog
          postId={post.id}
          onClose={() => setShowRequestChanges(false)}
          onDone={() => (window.location.href = "/console/blog")}
        />
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            disabled={!canEdit}
            className="w-full border-none bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-fg-subtle disabled:opacity-70"
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short excerpt (optional)"
            disabled={!canEdit}
            rows={2}
            className="mt-3 w-full resize-none border-none bg-transparent text-base text-fg-muted outline-none placeholder:text-fg-subtle disabled:opacity-70"
          />
          <div className="mt-6">
            <TiptapEditor
              content={content}
              editable={canEdit}
              onChange={(json, html) => {
                setContent(json);
                setContentHtml(html);
              }}
              placeholder="Write your story..."
            />
          </div>
        </div>

        <aside className="space-y-6">
          <SidebarCard title="Cover image">
            {coverUrl ? (
              <div className="relative">
                <img
                  src={coverUrl}
                  alt=""
                  className="w-full rounded-lg object-cover"
                />
                {canEdit ? (
                  <button
                    onClick={() => setCoverUrl("")}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/70 text-white hover:bg-black"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : canEdit ? (
              <label className="grid cursor-pointer place-items-center gap-2 rounded-lg border border-dashed border-border bg-bg-elevated p-6 text-center text-xs text-fg-muted hover:border-enterprise-primary/50">
                {uploadPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
                <span>{uploadPending ? "Uploading..." : "Upload cover"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </label>
            ) : null}
          </SidebarCard>

          <SidebarCard title="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </SidebarCard>

          <SidebarCard title="Tags (comma-separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={!canEdit}
              placeholder="fraud, ml, africa"
              className="w-full rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-sm outline-none"
            />
          </SidebarCard>

          <SidebarCard title="SEO">
            <div className="space-y-3">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                disabled={!canEdit}
                placeholder="SEO title (60 chars)"
                maxLength={80}
                className="w-full rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-sm outline-none"
              />
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                disabled={!canEdit}
                placeholder="Meta description"
                maxLength={200}
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
          </SidebarCard>

          <CommentsPanel
            postId={post.id}
            comments={comments}
            userMap={userMap}
            currentUserId={currentUserId}
            isReviewer={isReviewer}
          />

          {isReviewer ? (
            <RevisionsPanel
              revisions={revisions}
              userMap={userMap}
              onRestored={(msg) =>
                setBanner({ type: "success", message: msg })
              }
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SidebarCard(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
        {props.title}
      </p>
      {props.children}
    </div>
  );
}

function RequestChangesDialog(props: {
  postId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={props.onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6">
        <h2 className="text-lg font-semibold">Request changes</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Explain what needs to be revised. The author will see this as a comment.
        </p>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What needs to change?"
          rows={5}
          maxLength={2000}
          className="mt-4 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
        />

        {error ? (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            onClick={props.onClose}
            className="flex-1 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (feedback.trim().length < 3) return;
              startTransition(async () => {
                const r = await requestChangesAction({
                  post_id: props.postId,
                  feedback,
                });
                if (r.ok) props.onDone();
                else setError(r.error || "Failed");
              });
            }}
            disabled={isPending || feedback.trim().length < 3}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
