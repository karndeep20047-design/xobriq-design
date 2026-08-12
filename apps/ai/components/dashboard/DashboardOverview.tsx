"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Shield,
  Bot,
  Cloud,
  Activity,
  Key,
  BookOpen,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Wrench,
  Building2,
  Mail,
  TrendingUp,
  Zap,
  Loader2,
} from "lucide-react";
import { LoggedInToast } from "@/components/shared/LoggedInToast";
import { useDashboardUser } from "@/components/dashboard/DashboardShell";
import { requestProductAccessAction, createOrganizationAction } from "@/app/(platform)/actions";
import type { ProductAccessStatus, ProductSlug } from "@/lib/product-access";

export function DashboardOverview({
  productAccess,
  metrics,
}: {
  productAccess: Record<ProductSlug, ProductAccessStatus>;
  metrics: { activeApiKeys: number; subscribedProducts: number };
}) {
  const { firstName, orgName, memberSince } = useDashboardUser();

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <LoggedInToast />
      <WelcomeBanner firstName={firstName} orgName={orgName} memberSince={memberSince} />
      {!orgName ? <CreateOrganizationCard /> : null}
      <StatsGrid metrics={metrics} />
      <ProductsSection productAccess={productAccess} />
      <RoadmapAndResources />
      <FooterBar />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Self-serve org creation — shown in place of waiting on staff to set one
// up. Works just as well for a solo dev as a small team; team invites come
// later, this just gets them a name + org id of their own right away.
// ═══════════════════════════════════════════════════════════════════════

function CreateOrganizationCard() {
  const router = useRouter();
  const [teamSize, setTeamSize] = useState<"solo" | "team">("solo");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    formData.set("team_size", teamSize);
    startTransition(async () => {
      const result = await createOrganizationAction(formData);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error || "Failed to create organization. Please try again.");
      }
    });
  }

  return (
    <section className="mb-8">
      <div className="rounded-2xl border-2 border-enterprise-primary/20 bg-bg-subtle p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-enterprise-primary/15 text-enterprise-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Set up your organization</h2>
            <p className="text-sm text-fg-muted">
              Just a name to get started — you can invite teammates later. Solo? That&apos;s fine too.
            </p>
          </div>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Organization name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Acme Ltd"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Team size
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTeamSize("solo")}
                className={
                  "rounded-lg border px-3 py-2.5 text-xs font-semibold transition " +
                  (teamSize === "solo"
                    ? "border-enterprise-primary bg-enterprise-primary/10 text-enterprise-primary"
                    : "border-border bg-bg text-fg-muted hover:border-enterprise-primary/40")
                }
              >
                Just me
              </button>
              <button
                type="button"
                onClick={() => setTeamSize("team")}
                className={
                  "rounded-lg border px-3 py-2.5 text-xs font-semibold transition " +
                  (teamSize === "team"
                    ? "border-enterprise-primary bg-enterprise-primary/10 text-enterprise-primary"
                    : "border-border bg-bg text-fg-muted hover:border-enterprise-primary/40")
                }
              >
                A team
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="glow-hover inline-flex items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-5 py-2.5 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? "Creating…" : "Create organization"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Welcome banner
// ═══════════════════════════════════════════════════════════════════════

function WelcomeBanner({
  firstName,
  orgName,
  memberSince,
}: {
  firstName: string;
  orgName: string | null;
  memberSince: string;
}) {
  return (
    <section className="mb-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-subtle p-6 sm:p-8">
        <GradientOverlay />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-enterprise-primary">
              Client Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-fg-muted sm:text-base">
              This is where your organization&apos;s Xobriq products, API keys,
              and compliance controls will live.
            </p>
            <OrgBadge orgName={orgName} memberSince={memberSince} />
          </div>
          <BannerActions />
        </div>
      </div>
    </section>
  );
}

function GradientOverlay() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-enterprise-primary/8 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-enterprise-primary/10 blur-3xl" />
    </>
  );
}

function OrgBadge({
  orgName,
  memberSince,
}: {
  orgName: string | null;
  memberSince: string;
}) {
  if (!orgName) return null;
  return (
    <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-bg/70 px-3 py-1.5 text-xs">
      <Building2 className="h-3.5 w-3.5 text-enterprise-primary" />
      <span className="font-semibold">{orgName}</span>
      <span className="text-fg-subtle">· Member since {memberSince}</span>
    </div>
  );
}

function BannerActions() {
  return (
    <div className="flex flex-col gap-2 sm:min-w-[200px]">
      <MailtoButton
        href="mailto:onboarding@xobriq.com"
        label="Talk to onboarding"
        Icon={MessageCircle}
        primary
      />
      <MailtoButton
        href="mailto:info@xobriq.com"
        label="Contact support"
      />
    </div>
  );
}

function MailtoButton({
  href,
  label,
  Icon,
  primary = false,
}: {
  href: string;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition";
  const style = primary
    ? "glow-hover bg-enterprise-primary text-enterprise-on-primary hover:bg-enterprise-primary-hover"
    : "border border-border bg-bg/60 text-fg-muted hover:border-enterprise-primary/50 hover:text-fg";

  return (
    <a href={href} className={base + " " + style}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Stats grid
// ═══════════════════════════════════════════════════════════════════════

function StatsGrid({ metrics }: { metrics: { activeApiKeys: number; subscribedProducts: number } }) {
  return (
    <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        Icon={Activity}
        label="API Requests (30d)"
        value="—"
        hint="No request logging yet"
        tone="info"
      />
      <StatCard
        Icon={Key}
        label="Active API Keys"
        value={String(metrics.activeApiKeys)}
        hint={metrics.activeApiKeys > 0 ? "In use" : "Create when ready"}
        tone={metrics.activeApiKeys > 0 ? "success" : "neutral"}
      />
      <StatCard
        Icon={Shield}
        label="Subscribed Products"
        value={String(metrics.subscribedProducts)}
        hint={metrics.subscribedProducts > 0 ? "Active" : "No active plan yet"}
        tone={metrics.subscribedProducts > 0 ? "success" : "neutral"}
      />
      <StatCard
        Icon={CheckCircle2}
        label="Compliance"
        value="Ready"
        hint="Kenya DPA aligned"
        tone="success"
      />
    </section>
  );
}

function StatCard(props: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: "info" | "success" | "neutral";
}) {
  const Icon = props.Icon;
  const toneStyles = {
    info: "text-enterprise-primary bg-enterprise-primary/10",
    success: "text-emerald-400 bg-emerald-500/10",
    neutral: "text-fg-subtle bg-bg-subtle",
  };

  return (
    <div className="group rounded-2xl border border-border bg-bg-subtle p-4 transition-all hover:border-enterprise-primary/30 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle">
          {props.label}
        </p>
        <div
          className={
            "grid h-8 w-8 place-items-center rounded-lg transition-transform group-hover:scale-105 " +
            toneStyles[props.tone]
          }
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">{props.value}</p>
      <p className="mt-1 text-[10px] text-fg-subtle">{props.hint}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Products
// ═══════════════════════════════════════════════════════════════════════

function ProductsSection({ productAccess }: { productAccess: Record<ProductSlug, ProductAccessStatus> }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">Available products</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Request access to activate a product for your organization.
          </p>
        </div>
        <PricingLink />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RequestableProductCard
          slug="kyc"
          Icon={Bot}
          name="Xobriq KYC"
          tagline="AI Powered KYC"
          tone="accent"
          status={productAccess.kyc}
          openHref="/dashboard/xobriqKYC"
        />
        <RequestableProductCard
          slug="guard"
          Icon={Shield}
          name="Xobriq Guard"
          tagline="Real-time fraud & identity defence"
          tone="primary"
          status={productAccess.guard}
        />
        <RequestableProductCard
          slug="cloud"
          Icon={Cloud}
          name="Xobriq Cloud"
          tagline="H200 GPU compute · Nairobi"
          tone="emerald"
          status={productAccess.cloud}
        />
        <DiscoveryCard />
      </div>
    </section>
  );
}

// Every product on this dashboard now goes through the same real
// request -> pending -> approved flow (backed by product_access_requests,
// reviewed by staff in /console/product-access) instead of a hardcoded
// "active"/"not active" flag. Only KYC has a real destination to send an
// approved org to today (/dashboard/xobriqKYC, main's standalone KYC app) —
// it opens in a new window/tab so the client keeps this dashboard open.
// Guard/Cloud show "Approved" once granted but have no dashboard yet.
function RequestableProductCard({
  slug,
  Icon,
  name,
  tagline,
  tone,
  status,
  openHref,
}: {
  slug: ProductSlug;
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  tagline: string;
  tone: keyof typeof TONE_STYLES;
  status: ProductAccessStatus;
  openHref?: string;
}) {
  const [localStatus, setLocalStatus] = useState(status);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const style = TONE_STYLES[tone];

  function handleRequest() {
    setError("");
    startTransition(async () => {
      const result = await requestProductAccessAction(slug);
      if (result.ok) {
        setLocalStatus("pending");
      } else {
        setError(result.error || "Failed to submit request. Please try again.");
      }
    });
  }

  return (
    <div
      className={
        "group flex flex-col rounded-2xl border border-border bg-bg-subtle p-5 transition-all hover:shadow-lg " +
        style.border
      }
    >
      <div className="flex items-start gap-3">
        <div className={"grid h-10 w-10 place-items-center rounded-lg transition-transform group-hover:scale-110 " + style.bg}>
          <Icon className={"h-5 w-5 " + style.text} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{name}</p>
            <span
              className={
                "rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider " +
                (localStatus === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-bg text-fg-subtle")
              }
            >
              {localStatus === "approved" ? "Active" : "Not active"}
            </span>
          </div>
          <p className="mt-1 text-xs text-fg-muted">{tagline}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        {localStatus === "approved" && openHref ? (
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-enterprise-primary hover:underline"
          >
            Open dashboard
            <ArrowUpRight className="h-3 w-3" />
          </a>
        ) : localStatus === "approved" ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved — dashboard coming soon
          </span>
        ) : localStatus === "pending" ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Pending approval
          </span>
        ) : localStatus === "denied" ? (
          <a href="mailto:sales@xobriq.com" className="text-xs font-semibold text-fg-muted hover:underline">
            Not approved — contact sales
          </a>
        ) : (
          <button
            onClick={handleRequest}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-enterprise-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {isPending ? "Requesting…" : "Request access"}
          </button>
        )}
      </div>
      {error ? <p className="mt-2 text-[10px] text-xred-500">{error}</p> : null}
    </div>
  );
}

function PricingLink() {
  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1 text-sm font-semibold text-enterprise-primary hover:underline"
    >
      View all pricing
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

const TONE_STYLES: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  primary: {
    text: "text-enterprise-primary",
    bg: "bg-enterprise-primary/10",
    border: "hover:border-enterprise-primary/40",
  },
  accent: {
    text: "text-enterprise-accent",
    bg: "bg-enterprise-accent/10",
    border: "hover:border-enterprise-accent/40",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "hover:border-emerald-500/40",
  },
};

function DiscoveryCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-bg-subtle/50 p-6 text-center transition-colors hover:border-enterprise-primary/40">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-enterprise-primary/10 text-enterprise-primary">
        <MessageCircle className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold">Not sure yet?</p>
      <p className="mt-1 text-xs text-fg-muted max-w-[220px]">
        Book a 30-minute discovery call and we&apos;ll scope the right fit for
        you.
      </p>
      <DiscoveryLink />
    </div>
  );
}

function DiscoveryLink() {
  return (
    <Link
      href="/contact?type=discovery_call"
      className="mt-4 inline-flex items-center gap-1 rounded-lg border border-enterprise-primary/40 px-3 py-1.5 text-xs font-semibold text-enterprise-primary transition-colors hover:bg-enterprise-primary/10"
    >
      Book discovery call
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Roadmap + Resources
// ═══════════════════════════════════════════════════════════════════════

function RoadmapAndResources() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <RoadmapCard />
      <SidebarCards />
    </section>
  );
}

function RoadmapCard() {
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-6 lg:col-span-2">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-enterprise-primary" />
            <h2 className="text-lg font-semibold">Portal roadmap</h2>
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            Here&apos;s what&apos;s shipping and when.
          </p>
        </div>
        <span className="rounded-full bg-enterprise-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-enterprise-primary">
          In development
        </span>
      </div>

      <ol className="space-y-4">
        <RoadmapItem
          status="shipped"
          title="Account creation & email verification"
          desc="Sign up, verify your email, and access the portal."
          eta="Live"
        />
        <RoadmapItem
          status="in_progress"
          title="Organization onboarding"
          desc="Multi-user organizations, team invitations, role-based access."
          eta="This month"
        />
        <RoadmapItem
          status="planned"
          title="API keys & usage metering"
          desc="Generate keys, monitor consumption, set spend caps."
          eta="Q1 2027"
        />
        <RoadmapItem
          status="planned"
          title="Product provisioning"
          desc="Self-serve subscription to Guard, Cloud, and Agentic AI."
          eta="Q1 2027"
        />
        <RoadmapItem
          status="planned"
          title="Billing & invoices"
          desc="Card + bank payments, downloadable invoices, tax records."
          eta="Q2 2027"
        />
        <RoadmapItem
          status="planned"
          title="Compliance dashboards"
          desc="Kenya DPA, ISO 27001, and CBK reporting downloads."
          eta="Q3 2027"
        />
      </ol>
    </div>
  );
}

const STATUS_CONFIG = {
  shipped: {
    Icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-500/15",
    line: "border-emerald-500/30",
    label: "Live",
    labelColor: "bg-emerald-500/15 text-emerald-400",
  },
  in_progress: {
    Icon: Wrench,
    color: "text-enterprise-primary bg-enterprise-primary/15",
    line: "border-enterprise-primary/30",
    label: "In progress",
    labelColor: "bg-enterprise-primary/15 text-enterprise-primary",
  },
  planned: {
    Icon: Clock,
    color: "text-fg-subtle bg-bg",
    line: "border-border",
    label: "Planned",
    labelColor: "bg-bg text-fg-subtle",
  },
};

function RoadmapItem(props: {
  status: keyof typeof STATUS_CONFIG;
  title: string;
  desc: string;
  eta: string;
}) {
  const config = STATUS_CONFIG[props.status];
  const Icon = config.Icon;

  return (
    <li className="flex gap-3">
      <div
        className={
          "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 " +
          config.line +
          " " +
          config.color
        }
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{props.title}</p>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider " +
              config.labelColor
            }
          >
            {config.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-fg-muted">{props.desc}</p>
        <p className="mt-1 text-[10px] text-fg-subtle">ETA: {props.eta}</p>
      </div>
    </li>
  );
}

function SidebarCards() {
  return (
    <div className="space-y-4">
      <ResourcesCard />
      <SalesCard />
    </div>
  );
}

function ResourcesCard() {
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-6">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-enterprise-primary/15 text-enterprise-primary">
        <BookOpen className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">While you wait…</h3>
      <p className="mt-1 text-sm text-fg-muted">
        Explore what we&apos;re building.
      </p>
      <div className="mt-4 space-y-1">
        <ResourceLink href="/blog" label="Read the blog" />
        <ResourceLink href="/documents" label="Documentation" />
        <ResourceLink href="/about" label="About Xobriq" />
        <ResourceLink href="/ai-ethics" label="Our AI ethics" />
      </div>
    </div>
  );
}

function ResourceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg hover:text-fg"
    >
      <span>{label}</span>
      <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
    </Link>
  );
}

function SalesCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-subtle p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-enterprise-primary/10 to-transparent" />
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-enterprise-primary/20 text-enterprise-primary">
          <Zap className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          Need something now?
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          Our team can start engagements before self-serve ships.
        </p>
        <ContactSalesButton />
      </div>
    </div>
  );
}

function ContactSalesButton() {
  return (
    <a
      href="mailto:sales@xobriq.com"
      className="glow-hover mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2.5 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
    >
      <Mail className="h-3.5 w-3.5" />
      Contact sales
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════════════════

function FooterBar() {
  return (
    <footer className="mt-12 border-t border-border pt-6 pb-4 text-xs text-fg-subtle">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Xobriq Technologies Ltd · GTC Tower, 24th Floor, Westlands, Nairobi
        </p>
        <div className="flex gap-5">
          <FooterLink href="/privacy" label="Privacy" />
          <FooterLink href="/terms" label="Terms" />
          <FooterLink href="/ai-ethics" label="AI Ethics" />
          <ExternalMailLink href="mailto:info@xobriq.com" label="Support" />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="hover:text-fg">
      {label}
    </Link>
  );
}

function ExternalMailLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="hover:text-fg">
      {label}
    </a>
  );
}
