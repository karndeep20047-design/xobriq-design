// ============================================================================
//  FeatureGrid — responsive grid of feature/capability cards
//  Mobile: 1 col · Tablet: 2 col · Desktop: 3 col
// ============================================================================
import { LucideIcon } from "lucide-react";

export type Feature = {
  Icon: LucideIcon;
  title: string;
  body: string;
};

type FeatureGridProps = {
  features: Feature[];
  accent?: "blue" | "gold" | "teal" | "purple" | "red";
};

const accentMap = {
  blue:   "text-enterprise-primary",
  gold:   "text-xgold-600",
  teal:   "text-xteal-500",
  purple: "text-xpurple-500",
  red:    "text-xred-500",
};

export function FeatureGrid({ features, accent = "blue" }: FeatureGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ Icon, title, body }) => (
        <article
          key={title}
          className="rounded-2xl border border-border bg-bg-subtle p-6 transition hover:-translate-y-0.5 hover:border-border-strong"
        >
          <Icon className={"h-7 w-7 " + accentMap[accent]} />
          <h3 className="mt-4 text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p>
        </article>
      ))}
    </div>
  );
}