"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, User, ChevronDown } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type Props = {
  displayName: string;
  email: string;
  orgName: string | null;
};

export function UserMenu({ displayName, email, orgName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const firstName = displayName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-2 py-1.5 text-left transition-colors hover:border-enterprise-primary/40"
      >
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold leading-tight">{displayName}</p>
          <p className="text-[10px] leading-tight text-fg-subtle">
            {orgName || email}
          </p>
        </div>
        <div className="grid h-7 w-7 place-items-center rounded-full bg-enterprise-primary/15 text-xs font-bold text-enterprise-primary">
          {initial}
        </div>
        <ChevronDown
          className={
            "h-3 w-3 text-fg-subtle transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open && <MenuPanel email={email} orgName={orgName} />}
    </div>
  );
}

function MenuPanel({
  email,
  orgName,
}: {
  email: string;
  orgName: string | null;
}) {
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-bg-elevated shadow-2xl">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold text-fg">{email}</p>
        {orgName ? (
          <p className="mt-0.5 text-[10px] text-fg-subtle">{orgName}</p>
        ) : (
          <p className="mt-0.5 text-[10px] text-amber-400">
            Organization setup pending
          </p>
        )}
      </div>

      <div className="py-1">
        <MenuLink href="/dashboard" Icon={User} label="Profile" />
      </div>

      <div className="border-t border-border px-2 py-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-fg-muted">Appearance</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="border-t border-border p-2">
        {/* Fixed: logoutAction wrapped in <form> */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
