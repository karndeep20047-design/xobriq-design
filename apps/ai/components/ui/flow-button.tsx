"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FlowButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export const FlowButton = React.forwardRef<HTMLAnchorElement, FlowButtonProps>(
  ({ href = "/register", text, children, className = "", ...props }, ref) => {
    const labelText = text || children || "Get Started";

    const content = (
      <>
        {/* Left arrow (arr-2) */}
        <ArrowRight className="absolute left-[-25%] z-[9] h-4 w-4 fill-none stroke-x-bg transition-[left,stroke] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-hover:stroke-x-fg lg:transition-all lg:duration-[800ms] lg:ease-[cubic-bezier(0.34,1.56,0.64,1)]" />

        {/* Text */}
        <span className="relative z-[1] -translate-x-3 text-x-bg transition-[transform,color] duration-300 ease-out group-hover:translate-x-3 group-hover:text-x-fg lg:transition-all lg:duration-[800ms] lg:ease-out">
          {labelText}
        </span>

        {/* Expanding circle background */}
        <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-x-bg opacity-0 transition-[width,height,opacity,background-color] duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[260px] group-hover:w-[260px] group-hover:opacity-100 lg:transition-all lg:duration-[800ms] lg:ease-[cubic-bezier(0.19,1,0.22,1)]" />

        {/* Right arrow (arr-1) */}
        <ArrowRight className="absolute right-4 z-[9] h-4 w-4 fill-none stroke-x-bg transition-[right,stroke] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-hover:stroke-x-fg lg:transition-all lg:duration-[800ms] lg:ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
      </>
    );

    const buttonClasses = `group relative inline-flex h-11 sm:h-13 min-h-[44px] sm:min-h-[52px] items-center justify-center gap-1 overflow-hidden rounded-xl sm:rounded-[100px] border border-x-fg/40 bg-x-fg px-4 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold cursor-pointer transition-[border-radius,box-shadow,border-color,background-color,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-x-fg/60 hover:rounded-xl sm:hover:rounded-[100px] hover:shadow-[0_0_25px_rgba(63,169,255,0.35)] active:scale-[0.95] lg:transition-all lg:duration-[600ms] lg:ease-[cubic-bezier(0.23,1,0.32,1)] lg:hover:rounded-[12px] ${className}`;

    if (href) {
      return (
        <Link ref={ref} href={href} className={buttonClasses} {...props}>
          {content}
        </Link>
      );
    }

    return (
      <button className={buttonClasses}>
        {content}
      </button>
    );
  }
);

FlowButton.displayName = "FlowButton";
