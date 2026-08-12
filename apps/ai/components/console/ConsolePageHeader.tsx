"use client";

export function ConsolePageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs uppercase tracking-widest text-enterprise-accent">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function ConsoleCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-2xl border border-border bg-bg-subtle " + className}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  Icon,
}: {
  title: string;
  message: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="p-12 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-bg-elevated">
          <Icon className="h-5 w-5 text-fg-subtle" />
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 max-w-md mx-auto text-xs text-fg-muted">{message}</p>
    </div>
  );
}