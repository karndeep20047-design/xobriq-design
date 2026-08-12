"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Newspaper, Trash2, Edit3 } from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { createPostAction, deletePostAction } from "./actions";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  status: string;
  author_id: string;
  published_at: string | null;
  scheduled_for: string | null;
  updated_at: string;
  view_count: number;
  category_id: string | null;
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

export function BlogListClient(props: {
  posts: Post[];
  authorMap: Record<string, string>;
  currentUserId: string;
  isReviewer: boolean;
}) {
  const { posts, authorMap, currentUserId, isReviewer } = props;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    draft: posts.filter((p) => p.status === "draft").length,
    in_review: posts.filter((p) => p.status === "in_review").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Content"
        title="Blog CMS"
        description={
          isReviewer
            ? "Manage the editorial workflow. Review submissions and publish."
            : "Write, submit, and track your posts through the editorial workflow."
        }
        actions={
          <form
            action={async () => {
              await createPostAction();
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
            >
              <Plus className="h-4 w-4" /> New post
            </button>
          </form>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatBox label="Drafts" value={stats.draft} />
        <StatBox label="In Review" value={stats.in_review} tone="warn" />
        <StatBox label="Published" value={stats.published} tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg border border-border bg-bg-subtle py-2 pl-9 pr-3 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-bg-subtle p-1">
          {["all", "draft", "in_review", "published"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "rounded-md px-3 py-1 text-xs font-medium capitalize " +
                (statusFilter === s
                  ? "bg-enterprise-primary text-enterprise-on-primary"
                  : "text-fg-muted hover:text-fg")
              }
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <ConsoleCard>
        {filtered.length === 0 ? (
          <EmptyState
            Icon={Newspaper}
            title={posts.length === 0 ? "No posts yet" : "No matches"}
            message={
              posts.length === 0
                ? "Click New post to start writing."
                : "Try adjusting your filters."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-4 sm:px-6">
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-20 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-bg-elevated">
                    <Newspaper className="h-4 w-4 text-fg-subtle" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{post.title}</p>
                    <span
                      className={
                        "rounded px-2 py-0.5 text-[10px] font-semibold " +
                        STATUS_TONES[post.status]
                      }
                    >
                      {STATUS_LABELS[post.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-fg-muted">
                    {authorMap[post.author_id] || "Unknown"}
                    <span> · </span>
                    Updated {new Date(post.updated_at).toLocaleDateString()}
                    {post.view_count > 0 ? " · " + post.view_count + " views" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={"/console/blog/" + post.id}
                    className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-bg-elevated hover:text-fg"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Link>
                  {(post.author_id === currentUserId || isReviewer) &&
                  post.status !== "published" ? (
                    <button
                      onClick={() => {
                        if (!confirm("Delete this post?")) return;
                        startTransition(async () => {
                          await deletePostAction(post.id);
                        });
                      }}
                      disabled={isPending}
                      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-red-500/10 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </ConsoleCard>
    </div>
  );
}

function StatBox(props: { label: string; value: number; tone?: "success" | "warn" }) {
  const { label, value, tone } = props;
  const dot =
    tone === "success"
      ? "bg-emerald-400"
      : tone === "warn"
      ? "bg-amber-400"
      : "bg-fg-subtle";
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <div className="flex items-center gap-2">
        <div className={"h-1.5 w-1.5 rounded-full " + dot} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
