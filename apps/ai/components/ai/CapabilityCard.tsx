"use client";

import { motion } from "framer-motion";

type Props = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  bullets: string[];
  index: number;
};

export function CapabilityCard(props: Props) {
  const { Icon, title, desc, bullets, index } = props;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: index * 0.08 }} whileHover={{ y: -3 }} className="glass-panel flex flex-col rounded-2xl border border-enterprise-border bg-enterprise-bg-lower p-6 transition-colors hover:border-enterprise-primary/40">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/15">
        <Icon className="h-5 w-5 text-enterprise-primary" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-enterprise-fg">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-enterprise-fg-muted">{desc}</p>
      <ul className="mt-5 space-y-2 border-t border-enterprise-border pt-4">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-enterprise-fg-muted">
            <span className="h-1 w-1 rounded-full bg-enterprise-accent" />
            {b}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}