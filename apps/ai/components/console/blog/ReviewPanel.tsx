"use client";

import { useState, useTransition } from "react";
import {
  MessageSquare, History, Check, X, RotateCcw, Send, AlertCircle,
} from "lucide-react";
import {
  addCommentAction,
  toggleCommentResolvedAction,
  restoreRevisionAction,
} from "@/app/(console)/console/blog/review-actions";

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

export function CommentsPanel(props: {
  postId: string;
  comments: Comment[];
  userMap: Record<string, string>;
  currentUserId: string;
  isReviewer: boolean;
}) {
  const { postId, comments, userMap, currentUserId, isReviewer } = props;
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      const r = await addCommentAction({ post_id: postId, body: newComment });
      if (r.ok) setNewComment("");
    });
  };

  const handleToggle = (commentId: string) => {
    startTransition(async () => {
      await toggleCommentResolvedAction(commentId);
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-fg-subtle" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
          Comments · {comments.length}
        </p>
      </div>

      {comments.length === 0 ? (
        <p className="mb-3 text-xs text-fg-muted">
          No comments yet. Leave feedback for the author.
        </p>
      ) : (
        <div className="mb-3 space-y-2 max-h-[320px] overflow-y-auto">
          {comments.map((c) => {
            const canToggle = c.author_id === currentUserId || isReviewer;
            return (
              <div
                key={c.id}
                className={
                  "rounded-lg border p-2.5 text-xs " +
                  (c.resolved
                    ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                    : "border-border bg-bg-elevated")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {c.author_id ? userMap[c.author_id] || "Unknown" : "System"}
                      <span className="ml-2 font-normal text-fg-subtle">
                        {new Date(c.created_at).toLocaleString("en-KE", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-fg-muted">
                      {c.body}
                    </p>
                  </div>
                  {canToggle ? (
                    <button
                      onClick={() => handleToggle(c.id)}
                      className={
                        "shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase transition " +
                        (c.resolved
                          ? "text-fg-subtle hover:text-fg-muted"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20")
                      }
                      title={c.resolved ? "Unresolve" : "Mark resolved"}
                    >
                      {c.resolved ? "Reopen" : "Resolve"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-xs outline-none focus:border-enterprise-primary"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newComment.trim()}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-enterprise-primary px-3 py-1.5 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
          {isPending ? "Posting..." : "Post comment"}
        </button>
      </div>
    </div>
  );
}

export function RevisionsPanel(props: {
  revisions: Revision[];
  userMap: Record<string, string>;
  onRestored: (message: string) => void;
}) {
  const { revisions, userMap, onRestored } = props;
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-fg-subtle" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
          Revisions · {revisions.length}
        </p>
      </div>

      {revisions.length === 0 ? (
        <p className="text-xs text-fg-muted">No revisions yet.</p>
      ) : (
        <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
          {revisions.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-bg-elevated p-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.change_note || "(no note)"}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-fg-muted">
                  {r.changed_by ? userMap[r.changed_by] || "Unknown" : "System"}
                  {" · "}
                  {new Date(r.created_at).toLocaleString("en-KE", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!confirm("Restore this version? Current content will be snapshotted first.")) return;
                  startTransition(async () => {
                    const res = await restoreRevisionAction(r.id);
                    if (res.ok) onRestored("Revision restored");
                    else onRestored(res.error || "Failed");
                  });
                }}
                disabled={isPending}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-40"
                title="Restore this version"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
