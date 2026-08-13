"use client";

import * as React from "react";
import Link from "next/link";
import {
  IdCard,
  ShieldCheck,
  Bot,
  Cloud,
  GitBranch,
  ShieldAlert,
  FileText,
  BarChart3,
  BookOpen,
  Code2,
  Lock,
  Layers,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export type ProductItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  status: "live" | "soon";
};

export type ResourceItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

const products: ProductItem[] = [
  {
    title: "Xobriq KYC",
    href: "/kyc",
    description: "AI-powered identity verification & instant compliance.",
    icon: IdCard,
    iconColor: "text-emerald-600 dark:text-xgreen-400",
    status: "live",
  },
  {
    title: "Xobriq Guard",
    href: "/guard",
    description: "Fraud, deepfake, and real-time identity intelligence.",
    icon: ShieldCheck,
    iconColor: "text-teal-600 dark:text-xteal-400",
    status: "soon",
  },
  {
    title: "Agentic AI",
    href: "/agentic",
    description: "Autonomous enterprise workforce & agentic workflows.",
    icon: Bot,
    iconColor: "text-purple-600 dark:text-xpurple-400",
    status: "soon",
  },
  {
    title: "Xobriq Cloud",
    href: "/cloud",
    description: "Sovereign GPU compute clusters hosted in Nairobi.",
    icon: Cloud,
    iconColor: "text-blue-600 dark:text-xblue-400",
    status: "soon",
  },
  {
    title: "Xobriq Consult",
    href: "/consult",
    description: "Strategic AI advisory, model tuning & MLOps engineering.",
    icon: GitBranch,
    iconColor: "text-amber-600 dark:text-xgold-500",
    status: "soon",
  },
  {
    title: "Xobriq Cyber",
    href: "/cyber",
    description: "Autonomous threat defense, SIEM, and SOC operations.",
    icon: ShieldAlert,
    iconColor: "text-red-600 dark:text-xred-400",
    status: "soon",
  },
];

const solutions: ResourceItem[] = [
  {
    title: "Financial Verification",
    href: "/kyc",
    description: "Bank-grade identity verification for fintech & banking.",
    icon: Lock,
  },
  {
    title: "Enterprise AI Agents",
    href: "/agentic",
    description: "Automate complex decision loops with multi-agent systems.",
    icon: Layers,
  },
];

const resources: ResourceItem[] = [
  {
    title: "Case Studies",
    href: "/case-studies",
    description: "Real production deployments and verified impact metrics.",
    icon: FileText,
  },
  {
    title: "Benchmarks",
    href: "/benchmarks",
    description: "Latency, accuracy, and throughput benchmark performance.",
    icon: BarChart3,
  },
  {
    title: "Engineering Blog",
    href: "/blog",
    description: "Technical deep-dives & research from the Xobriq team.",
    icon: BookOpen,
  },
  {
    title: "Developer SDKs",
    href: "/developers",
    description: "API references, TypeScript client, and quickstarts.",
    icon: Code2,
  },
];

function ProductStatusBadge({ status }: { status: "live" | "soon" }) {
  return status === "live" ? (
    <span className="inline-flex items-center justify-center h-5 shrink-0 px-2 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center justify-center h-5 shrink-0 px-2 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/50">
      Soon
    </span>
  );
}

interface RichNavigationMenuProps {
  overHero?: boolean;
}

export default function RichNavigationMenu({ overHero = false }: RichNavigationMenuProps) {
  const productsHoverRef = React.useRef<number>(0);
  const resourcesHoverRef = React.useRef<number>(0);

  const triggerStyle = cn(
    navigationMenuTriggerStyle(),
    "transition-colors duration-200 font-medium text-sm rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-transparent dark:focus:bg-transparent focus-visible:bg-slate-100 dark:focus-visible:bg-white/10 focus-visible:outline-none data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-white/10",
    overHero
      ? "text-slate-800 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white"
      : "text-slate-800 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white"
  );

  return (
    <NavigationMenu className="z-50">
      <NavigationMenuList className="gap-1">
        {/* Products Mega Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={triggerStyle}
            onMouseEnter={() => {
              productsHoverRef.current = Date.now();
            }}
            onMouseLeave={() => {
              productsHoverRef.current = 0;
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && productsHoverRef.current && Date.now() - productsHoverRef.current < 400) {
                e.preventDefault();
              }
            }}
            onClick={(e) => {
              const isMouse = e.nativeEvent instanceof PointerEvent ? e.nativeEvent.pointerType === "mouse" : true;
              if (isMouse && productsHoverRef.current && Date.now() - productsHoverRef.current < 400) {
                e.preventDefault();
              }
            }}
          >
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[820px] grid-cols-3 divide-x divide-slate-200/80 dark:divide-zinc-800/80 p-4 bg-white dark:bg-[#09090b]">
              <div className="col-span-2 pe-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-zinc-800/60 mb-2">
                  <h6 className="pl-1 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                    Core Capabilities
                  </h6>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">6 AI Platforms</span>
                </div>
                <ul className="grid grid-cols-2 gap-1.5">
                  {products.map((p) => (
                    <ProductListItem key={p.title} product={p} />
                  ))}
                </ul>
              </div>

              <div className="pl-4 flex flex-col justify-between">
                <div>
                  <h6 className="pl-1 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider pb-3 border-b border-slate-200/80 dark:border-zinc-800/60 mb-2">
                    Solutions
                  </h6>
                  <ul className="space-y-1.5">
                    {solutions.map((s) => (
                      <ListItem
                        key={s.title}
                        href={s.href}
                        icon={s.icon}
                        title={s.title}
                      >
                        {s.description}
                      </ListItem>
                    ))}
                  </ul>
                </div>

                <div className="relative overflow-hidden mt-4 rounded-lg border p-3.5 transition-all duration-300 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-indigo-50/80 border-emerald-200/90 shadow-sm hover:border-emerald-400/80 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-indigo-950/70 dark:border-emerald-500/30 dark:hover:border-emerald-400/60 dark:shadow-none">
                  {/* Aurora Glow backdrop overlay */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-indigo-500/20 blur-xl dark:from-emerald-400/25 dark:via-teal-400/15 dark:to-indigo-500/25"
                  />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Need Enterprise SLA?</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-emerald-100/70 mt-1 leading-relaxed">
                      Dedicated GPU compute & custom compliance.
                    </p>
                    <Link
                      href="/contact"
                      className="group mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
                    >
                      Contact Sales
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={triggerStyle}
            onMouseEnter={() => {
              resourcesHoverRef.current = Date.now();
            }}
            onMouseLeave={() => {
              resourcesHoverRef.current = 0;
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && resourcesHoverRef.current && Date.now() - resourcesHoverRef.current < 400) {
                e.preventDefault();
              }
            }}
            onClick={(e) => {
              const isMouse = e.nativeEvent instanceof PointerEvent ? e.nativeEvent.pointerType === "mouse" : true;
              if (isMouse && resourcesHoverRef.current && Date.now() - resourcesHoverRef.current < 400) {
                e.preventDefault();
              }
            }}
          >
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[500px] p-4 bg-white dark:bg-[#09090b]">
              <h6 className="pl-1 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider pb-3 border-b border-slate-200/80 dark:border-zinc-800/60 mb-2">
                Knowledge & Developers
              </h6>
              <ul className="grid grid-cols-2 gap-1.5">
                {resources.map((r) => (
                  <ListItem
                    key={r.title}
                    href={r.href}
                    icon={r.icon}
                    title={r.title}
                  >
                    {r.description}
                  </ListItem>
                ))}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Direct Links */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={triggerStyle}>
            <Link href="/pricing">Pricing</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={triggerStyle}>
            <Link href="/docs">Docs</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={triggerStyle}>
            <Link href="/about">About Us</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={triggerStyle}>
            <Link href="/careers">Careers</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ProductListItem = ({ product }: { product: ProductItem }) => {
  const Icon = product.icon;
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={product.href}
          className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] focus:bg-slate-100/80 dark:focus:bg-white/[0.06] outline-none"
        >
          <Icon className={cn("h-5 w-5 shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5", product.iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">
                {product.title}
              </span>
              <ProductStatusBadge status={product.status} />
            </div>
            <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-300 leading-relaxed transition-colors">
              {product.description}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const ListItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & { icon: LucideIcon; title: string }
>(({ className, title, children, icon: Icon, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href}
          className={cn(
            "group flex items-start gap-2.5 rounded-lg p-2.5 no-underline outline-none transition-colors duration-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] focus:bg-slate-100/80 dark:focus:bg-white/[0.06]",
            className
          )}
          {...props}
        >
          <Icon className="h-5 w-5 text-slate-400 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-xgreen-400 transition-colors shrink-0 mt-0.5 group-hover:scale-110" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-xgreen-400 transition-colors">
              {title}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-300 leading-relaxed transition-colors">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
