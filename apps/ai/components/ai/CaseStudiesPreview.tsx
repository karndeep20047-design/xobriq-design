"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "./animations";

type Model = {
  image: string;
  imageAlt: string;
  tag: string;
  tagColor: "primary" | "accent";
  title: string;
  body: string;
};

const models: Model[] = [
  {
    image: "/images/ops-dashboard.png",
    imageAlt: "Fraud operations dashboard",
    tag: "Financial Services",
    tagColor: "primary",
    title: "Shadow-mode fraud pilots",
    body: "Xobriq Guard runs alongside your existing fraud stack in shadow mode first, so you can see detection lift on your own traffic before anything goes live.",
  },
  {
    image: "/images/gpu-rack.png",
    imageAlt: "GPU server racks in a data center",
    tag: "Infrastructure",
    tagColor: "accent",
    title: "Sovereign cloud buildouts",
    body: "Dedicated GPU capacity on our Nairobi cluster, scoped to your compliance and data residency requirements from day one.",
  },
];

export function CaseStudiesPreview() {
  return (
    <section className="bg-enterprise-bg py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <h3 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
          Built for Real-World Deployment
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-center text-enterprise-fg-muted">
          Every engagement starts with a pilot on your own data — measurable results in your
          environment, not a marketing benchmark sheet.
        </p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-14 grid gap-6 md:grid-cols-2"
        >
          {models.map((m) => (<ModelCard key={m.title} m={m} />))}
        </motion.div>
      </div>
    </section>
  );
}

function ModelCard({ m }: { m: Model }) {
  const tagClasses = m.tagColor === "primary"
    ? "bg-enterprise-primary/15 text-enterprise-primary"
    : "bg-enterprise-accent/20 text-enterprise-accent";

  const linkClasses = "label-caps-thin mt-6 inline-flex items-center gap-2 " +
    (m.tagColor === "primary" ? "text-enterprise-primary" : "text-enterprise-accent");

  return (
    <motion.article variants={fadeInUp} whileHover={{ y: -6 }} className="glass-panel group relative overflow-hidden rounded-2xl">
      <div className="relative h-64 overflow-hidden">
        <Image src={m.image} alt={m.imageAlt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-enterprise-bg via-enterprise-bg/40 to-transparent" />
      </div>
      <div className="relative -mt-12 p-8">
        <span className={"label-caps-thin rounded-full px-3 py-1 " + tagClasses}>{m.tag}</span>
        <h4 className="mt-6 text-2xl font-semibold">{m.title}</h4>
        <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">{m.body}</p>
        <Link href="/case-studies" className={linkClasses}>
          <span>See how engagements work</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}
