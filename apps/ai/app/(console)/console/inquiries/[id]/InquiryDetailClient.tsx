"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Building2, MessageSquare, Save,
  Calendar, Globe, Tag, Clock, FileText, Download, Loader2,
} from "lucide-react";
import { ConsoleCard } from "@/components/console/ConsolePageHeader";
import {
  updateInquiryStatusAction, assignInquiryAction, saveInquiryNotesAction, sendInquiryReplyAction,
} from "../actions";
import { getConsultantCVDownloadUrlAction } from "@/app/(public)/careers/consultant-actions";

type Inquiry = {
  id: string;
  type: string;
  source_site: string;
  source_page: string | null;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  industry: string | null;
  message: string | null;
  interested_products: string[] | null;
  budget_range: string | null;
  urgency: string;
  status: string;
  assigned_to: string | null;
  internal_notes: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  responded_at: string | null;
  created_at: string;
};

type SalesUser = {
  id: string;
  full_name: string | null;
  email: string;
  xobriq_staff_role: string;
};

type InquiryReply = {
  id: string;
  message: string;
  created_at: string;
  sender_name: string;
};

const STATUSES = ["new", "contacted", "qualified", "won", "lost", "spam", "archived"];

export function InquiryDetailClient(props: { inquiry: Inquiry; salesTeam: SalesUser[]; replies: InquiryReply[] }) {
  const inquiry = props.inquiry;
  const salesTeam = props.salesTeam;
  const [notes, setNotes] = useState(inquiry.internal_notes || "");
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [replies, setReplies] = useState(props.replies);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyState, setReplyState] = useState<"idle" | "sending" | "error">("idle");
  const [replyError, setReplyError] = useState<string | null>(null);

  function handleSendReply() {
    const trimmed = replyMessage.trim();
    if (!trimmed) return;
    setReplyState("sending");
    setReplyError(null);
    startTransition(async function () {
      const result = await sendInquiryReplyAction(inquiry.id, trimmed);
      if (!result.ok) {
        setReplyState("error");
        setReplyError(result.error || "Failed to send reply");
        return;
      }
      setReplies(function (cur) {
        return cur.concat([{
          id: "temp-" + Date.now(),
          message: trimmed,
          created_at: new Date().toISOString(),
          sender_name: "You",
        }]);
      });
      setReplyMessage("");
      setReplyState("idle");
    });
  }

  function handleStatusChange(status: string) {
    startTransition(function () { updateInquiryStatusAction(inquiry.id, status); });
  }
  function handleAssign(userId: string) {
    startTransition(function () { assignInquiryAction(inquiry.id, userId || null); });
  }
  function handleSaveNotes() {
    setSaveStatus("saving");
    startTransition(async function () {
      await saveInquiryNotesAction(inquiry.id, notes);
      setSaveStatus("saved");
      setTimeout(function () { setSaveStatus("idle"); }, 2000);
    });
  }

  const mailtoLink = "mailto:" + inquiry.email + "?subject=Re: Your inquiry to Xobriq";
  const telLink = inquiry.phone ? "tel:" + inquiry.phone : "";
  const sourceDesc = inquiry.source_page ? inquiry.source_site + " · " + inquiry.source_page : inquiry.source_site;

  // No dedicated columns for these — the contact form's date/time picker
  // (shown only for demo_request inquiries) rides inside the metadata jsonb
  // catch-all, same as the internal notification email reads it.
  const preferredDate = typeof inquiry.metadata?.preferred_date === "string" ? inquiry.metadata.preferred_date : null;
  const preferredTime = typeof inquiry.metadata?.preferred_time === "string" ? inquiry.metadata.preferred_time : null;
  const preferredWhen = [preferredDate, preferredTime].filter(Boolean).join(" at ");

  // Consultant Expert Roster applications ride inside metadata too — see
  // app/(public)/careers/consultant-actions.ts.
  const meta = inquiry.metadata || {};
  const isConsultantApplication = meta.application_kind === "consultant_roster";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <Link
        href="/console/inquiries"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All inquiries
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <ConsoleCard className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{inquiry.full_name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-fg-muted">
                  <a href={mailtoLink} className="inline-flex items-center gap-1.5 hover:text-enterprise-primary">
                    <Mail className="h-3.5 w-3.5" /> {inquiry.email}
                  </a>
                  {inquiry.phone ? (<a href={telLink} className="inline-flex items-center gap-1.5 hover:text-enterprise-primary"><Phone className="h-3.5 w-3.5" /> {inquiry.phone}</a>) : null}
                  {inquiry.company ? (<span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {inquiry.company}</span>) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <MetaItem Icon={Tag} label="Type" value={inquiry.type.replace(/_/g, " ")} />
              {preferredWhen ? (<MetaItem Icon={Clock} label="Requested Time" value={preferredWhen} />) : null}
              <MetaItem Icon={Globe} label="Source" value={sourceDesc} />
              <MetaItem Icon={Calendar} label="Received" value={new Date(inquiry.created_at).toLocaleString("en-KE")} />
              {inquiry.responded_at ? (<MetaItem Icon={Clock} label="Responded" value={new Date(inquiry.responded_at).toLocaleString("en-KE")} />) : null}
              {inquiry.industry ? (<MetaItem Icon={Building2} label="Industry" value={inquiry.industry} />) : null}
              {inquiry.budget_range ? (<MetaItem Icon={Tag} label="Budget" value={inquiry.budget_range} />) : null}
            </div>

            {inquiry.interested_products && inquiry.interested_products.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Interested Products</p>
                <div className="flex flex-wrap gap-2">
                  {inquiry.interested_products.map(function (p) {
                    return <span key={p} className="rounded-full bg-enterprise-primary/10 px-3 py-1 text-xs font-medium text-enterprise-primary">{p}</span>;
                  })}
                </div>
              </div>
            ) : null}

            {inquiry.message ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Message</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-fg-muted">{inquiry.message}</p>
              </div>
            ) : null}
          </ConsoleCard>

          <ConsoleCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-fg-subtle" />
              <p className="text-sm font-semibold">Reply</p>
            </div>

            {replies.length > 0 ? (
              <div className="mb-4 space-y-3 border-b border-border pb-4">
                {replies.map(function (r) {
                  return (
                    <div key={r.id} className="rounded-lg bg-bg-elevated p-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-fg-subtle">
                        <span className="font-semibold uppercase tracking-wider">{r.sender_name}</span>
                        <span>{new Date(r.created_at).toLocaleString("en-KE")}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-fg-muted">{r.message}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <textarea
              value={replyMessage}
              onChange={function (e) { setReplyMessage(e.target.value); }}
              placeholder={"Reply to " + inquiry.full_name + "..."}
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {replyState === "error" ? <p className="text-xs text-red-500">{replyError}</p> : null}
                <a href={mailtoLink} className="text-xs text-fg-subtle hover:text-fg-muted">
                  or reply via your own email client
                </a>
              </div>
              <button
                onClick={handleSendReply}
                disabled={isPending || replyState === "sending" || !replyMessage.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-3 py-1.5 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
              >
                <Mail className="h-3 w-3" /> {replyState === "sending" ? "Sending…" : "Send reply"}
              </button>
            </div>
          </ConsoleCard>

          {isConsultantApplication ? (
            <ConsultantApplicationCard inquiryId={inquiry.id} metadata={meta} />
          ) : null}

          <ConsoleCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-fg-subtle" />
              <p className="text-sm font-semibold">Internal notes</p>
            </div>
            <textarea value={notes} onChange={function (e) { setNotes(e.target.value); }} placeholder="Add internal notes about this lead..." rows={5} className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary" />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-fg-subtle">{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : ""}</p>
              <button onClick={handleSaveNotes} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-3 py-1.5 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50">
                <Save className="h-3 w-3" /> Save notes
              </button>
            </div>
          </ConsoleCard>
        </div>

        <aside className="space-y-4">
          <ConsoleCard className="p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Status</p>
            <select value={inquiry.status} onChange={function (e) { handleStatusChange(e.target.value); }} disabled={isPending} className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none">
              {STATUSES.map(function (s) { return <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>; })}
            </select>
          </ConsoleCard>

          <ConsoleCard className="p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Assigned to</p>
            <select value={inquiry.assigned_to || ""} onChange={function (e) { handleAssign(e.target.value); }} disabled={isPending} className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none">
              <option value="">Unassigned</option>
              {salesTeam.map(function (u) {
                const label = (u.full_name || u.email) + " (" + u.xobriq_staff_role + ")";
                return <option key={u.id} value={u.id}>{label}</option>;
              })}
            </select>
          </ConsoleCard>

          {inquiry.ip_address || inquiry.user_agent ? (
            <ConsoleCard className="p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Technical</p>
              <div className="space-y-2 text-xs">
                {inquiry.ip_address ? (<div><p className="text-fg-subtle">IP</p><p className="font-mono">{inquiry.ip_address}</p></div>) : null}
                {inquiry.user_agent ? (<div><p className="text-fg-subtle">User Agent</p><p className="break-all font-mono text-[10px] text-fg-muted">{inquiry.user_agent}</p></div>) : null}
              </div>
            </ConsoleCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ConsultantApplicationCard(props: { inquiryId: string; metadata: Record<string, unknown> }) {
  const m = props.metadata;
  const str = (key: string) => (typeof m[key] === "string" ? (m[key] as string) : null);
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "error">("idle");

  async function handleDownload() {
    setDownloadState("loading");
    const result = await getConsultantCVDownloadUrlAction(props.inquiryId);
    if (result.ok && result.url) {
      window.open(result.url, "_blank", "noopener,noreferrer");
      setDownloadState("idle");
    } else {
      setDownloadState("error");
    }
  }

  const fields: Array<[string, string | null]> = [
    ["Role applied for", str("role_title")],
    ["Country", str("country")],
    ["Degree / field", str("degree")],
    ["Institution / year", str("institution")],
    ["Total experience", str("total_years") ? str("total_years") + " years" : null],
    ["Relevant experience", str("relevant_years") ? str("relevant_years") + " years" : null],
    ["Certifications", str("certifications")],
    ["Registration number", str("registration_number")],
    ["Portfolio / LinkedIn", str("portfolio_url")],
    ["Reference 1", str("reference_1")],
    ["Reference 2", str("reference_2")],
  ];

  return (
    <ConsoleCard className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-fg-subtle" />
          <p className="text-sm font-semibold">Consultant application details</p>
        </div>
        {m.cv_storage_path ? (
          <button
            onClick={handleDownload}
            disabled={downloadState === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-3 py-1.5 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            {downloadState === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Download CV
          </button>
        ) : null}
      </div>

      {downloadState === "error" ? (
        <p className="mb-3 text-xs text-xred-500">Could not generate a download link. Try again.</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) =>
          value ? <MetaItem key={label} Icon={Tag} label={label} value={value} /> : null
        )}
      </div>
    </ConsoleCard>
  );
}

function MetaItem(props: { Icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  const Icon = props.Icon;
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
        <Icon className="h-3 w-3" /> {props.label}
      </div>
      <p className="mt-1 text-sm capitalize">{props.value}</p>
    </div>
  );
}