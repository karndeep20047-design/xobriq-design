export function PageHeader({
  Icon,
  title,
  subtitle,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-enterprise-primary/10 text-enterprise-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>
      </div>
    </div>
  );
}
