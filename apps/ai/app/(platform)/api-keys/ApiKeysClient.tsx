"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, RotateCcw, Ban, Plus, Check, AlertTriangle, FlaskConical, Rocket } from "lucide-react";
import { generateApiKeyAction, rotateApiKeyAction, revokeApiKeyAction } from "./actions";
import type { ApiKeyEnvironment } from "@/lib/kyc/api-keys";

type EnvFilter = "all" | ApiKeyEnvironment;

const WORKSPACES: { env: ApiKeyEnvironment; name: string; Icon: typeof FlaskConical }[] = [
  { env: "test", name: "Sandbox", Icon: FlaskConical },
  { env: "live", name: "Production", Icon: Rocket },
];

export type ApiKeyRow = {
  id: string;
  name: string;
  environment: ApiKeyEnvironment;
  key_prefix: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
  rotated_at: string | null;
  revoked_at: string | null;
};

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>("test");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<EnvFilter>("all");
  const [, startTransition] = useTransition();

  const workspaceSummaries = useMemo(
    () =>
      WORKSPACES.map((w) => {
        const rows = keys.filter((k) => k.environment === w.env);
        return {
          ...w,
          total: rows.length,
          active: rows.filter((r) => r.status === "active").length,
          revoked: rows.filter((r) => r.status === "revoked").length,
        };
      }),
    [keys]
  );

  const visibleKeys = envFilter === "all" ? keys : keys.filter((k) => k.environment === envFilter);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await generateApiKeyAction(name, environment);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRevealedKey(result.fullKey);
      setName("");
      // Optimistic row — the real row (without the secret) comes back on
      // next navigation/revalidate; this just avoids a blank gap until then.
      setKeys((prev) => [
        {
          id: result.keyId,
          name: name.trim() || (environment === "live" ? "Production key" : "Sandbox key"),
          environment,
          key_prefix: result.fullKey.slice(0, 16),
          status: "active",
          created_at: new Date().toISOString(),
          last_used_at: null,
          rotated_at: null,
          revoked_at: null,
        },
        ...prev,
      ]);
    });
  }

  function handleRotate(id: string) {
    if (!window.confirm("Rotate this key? The old secret stops working immediately.")) return;
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await rotateApiKeyAction(id);
      setBusyId(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRevealedKey(result.fullKey);
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, rotated_at: new Date().toISOString() } : k))
      );
    });
  }

  function handleRevoke(id: string) {
    if (!window.confirm("Revoke this key? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await revokeApiKeyAction(id);
      setBusyId(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, status: "revoked", revoked_at: new Date().toISOString() } : k))
      );
    });
  }

  return (
    <div>
      {/* Workspaces — Sandbox/Production are environments on the same
          api_keys data below, not a separate entity; these cards double as
          the environment filter for the list rather than just a summary. */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {workspaceSummaries.map((w) => {
          const Icon = w.Icon;
          const active = envFilter === w.env;
          return (
            <button
              key={w.env}
              type="button"
              onClick={() => setEnvFilter(active ? "all" : w.env)}
              className={
                "group rounded-2xl border p-6 text-left transition-all hover:-translate-y-1 hover:shadow-lg " +
                (active
                  ? "border-enterprise-primary/60 bg-enterprise-primary/5"
                  : "border-border bg-bg-subtle hover:border-enterprise-primary/30")
              }
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-primary/10 text-enterprise-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">{w.name}</h2>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{w.total}</p>
                  <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Keys</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-emerald-400">{w.active}</p>
                  <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-fg-subtle">{w.revoked}</p>
                  <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Revoked</p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-enterprise-primary">
                {active ? "Showing this workspace only — click to clear" : "Filter keys to this workspace"}
              </span>
            </button>
          );
        })}
      </div>

      {revealedKey ? (
        <div className="mt-6 rounded-2xl border border-enterprise-primary/40 bg-enterprise-primary/5 p-6">
          <div className="flex items-start gap-2 text-sm font-semibold text-enterprise-primary">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Save this key now — it won&apos;t be shown again
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-bg p-3">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">{revealedKey}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-bg-subtle"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs font-medium text-fg-muted hover:text-fg"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      ) : null}

      <form onSubmit={handleGenerate} className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-bg-subtle p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Key name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Backend integration"
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Environment</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as ApiKeyEnvironment)}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm sm:w-40"
          >
            <option value="test">Sandbox</option>
            <option value="live">Production</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-medium text-enterprise-on-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Generate key
        </button>
      </form>

      <p className="mt-3 text-xs text-fg-muted">
        Sandbox and Production keys currently behave identically — every call is a real, billed
        verification against Creditinfo regardless of environment. Sandbox is a label for your own
        organization, not yet a safe/free testing mode.
      </p>

      <div className="mt-6 grid gap-4">
        {keys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-fg-muted">
            No API keys yet — generate one above to start calling the KYC API directly.
          </div>
        ) : visibleKeys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-fg-muted">
            No keys in this workspace yet.{" "}
            <button type="button" onClick={() => setEnvFilter("all")} className="font-medium text-enterprise-primary hover:underline">
              Show all workspaces
            </button>
          </div>
        ) : (
          visibleKeys.map((key) => (
            <div key={key.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-subtle p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{key.name}</h2>
                  <span className="rounded-full bg-fg-subtle/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                    {key.environment === "live" ? "Production" : "Sandbox"}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                      (key.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")
                    }
                  >
                    {key.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-fg-subtle">{key.key_prefix}••••••••</p>
                <p className="mt-1 text-[11px] text-fg-subtle">
                  Created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at ? ` · Last used ${new Date(key.last_used_at).toLocaleString()}` : " · Never used"}
                  {key.rotated_at ? ` · Rotated ${new Date(key.rotated_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              {key.status === "active" ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId === key.id}
                    onClick={() => handleRotate(key.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-bg disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Rotate
                  </button>
                  <button
                    type="button"
                    disabled={busyId === key.id}
                    onClick={() => handleRevoke(key.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Revoke
                  </button>
                </div>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-fg-subtle">
                  <Check className="h-3.5 w-3.5" />
                  Revoked {key.revoked_at ? new Date(key.revoked_at).toLocaleDateString() : ""}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
