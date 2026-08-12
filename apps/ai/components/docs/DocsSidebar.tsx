"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DocLink = { href: string; label: string; badge?: string };
type DocGroup = { title: string; items: DocLink[] };

const groups: DocGroup[] = [
  { title: "Get started", items: [
    { href: "/docs", label: "Welcome" },
    { href: "/docs/quickstart", label: "Quickstart" },
    { href: "/docs/workflow", label: "Choose a workflow" },
    { href: "/docs/concepts", label: "Concepts" },
    { href: "/docs/api-keys", label: "Manage API keys" },
    { href: "/docs/agents", label: "Agent skills", badge: "NEW" },
    { href: "/docs/early-access", label: "Early access", badge: "NEW" },
  ]},
  { title: "Guard", items: [
    { href: "/docs/guard", label: "Overview" },
    { href: "/docs/guard/score", label: "Fraud detection API" },
    { href: "/docs/guard/deepfake", label: "Deepfake detection" },
    { href: "/docs/guard/identity", label: "Identity verification" },
    { href: "/docs/guard/behavioural", label: "Behavioural analytics" },
    { href: "/docs/guard/cases", label: "Case management" },
    { href: "/docs/guard/webhooks", label: "Webhooks" },
  ]},
  { title: "Cloud", items: [
    { href: "/docs/cloud", label: "Overview" },
    { href: "/docs/cloud/instances", label: "Spin up a GPU instance" },
    { href: "/docs/cloud/reserved", label: "Reserved capacity" },
    { href: "/docs/cloud/sovereign", label: "Sovereign partition" },
    { href: "/docs/cloud/inference", label: "Inference hosting" },
    { href: "/docs/cloud/training", label: "Training pipelines" },
  ]},
  { title: "Agentic", items: [
    { href: "/docs/agentic", label: "Overview" },
    { href: "/docs/agentic/prebuilt", label: "Pre-built agents" },
    { href: "/docs/agentic/custom", label: "Custom agent design" },
    { href: "/docs/agentic/sdk", label: "Agent SDK" },
  ]},
  { title: "Platform", items: [
    { href: "/docs/auth", label: "Authentication" },
    { href: "/docs/rate-limits", label: "Rate limits" },
    { href: "/docs/errors", label: "Errors" },
    { href: "/docs/audit-logs", label: "Audit logs" },
    { href: "/docs/sdks", label: "SDKs" },
  ]},
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="docs-scroll sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-bg-subtle md:block xl:w-64">
      <nav className="px-3 pb-12 pt-4">
        {groups.map((group) => (
          <div key={group.title} className="mt-5 first:mt-0">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{group.title}</p>
            <ul className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const linkClass = active
                  ? "flex items-center justify-between rounded-md bg-enterprise-primary/10 px-2.5 py-1.5 text-sm font-medium text-enterprise-primary"
                  : "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg";
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="rounded bg-enterprise-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-enterprise-primary">{item.badge}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}