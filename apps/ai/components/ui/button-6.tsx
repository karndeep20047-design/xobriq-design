"use client";

import * as React from "react";
import Link from "next/link";

interface Button6Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const Button6 = React.forwardRef<HTMLAnchorElement, Button6Props>(
  ({ href, children, className = "", ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={`group relative inline-flex h-11 sm:h-13 min-h-[44px] sm:min-h-[52px] items-center justify-center overflow-hidden rounded-xl sm:rounded-full border border-x-line-strong dark:border-blue-500/80 font-semibold text-xs sm:text-sm transition-[border-color,box-shadow,transform] duration-300 hover:border-x-accent/60 hover:shadow-[0_0_25px_rgba(63,169,255,0.35)] active:scale-98 ${className}`}
        {...props}
      >
        <div className="inline-flex h-full w-full translate-y-0 items-center justify-center px-4 sm:px-8 bg-x-raised dark:bg-[#0072c4] text-x-fg dark:text-white transition-transform duration-300 group-hover:-translate-y-[150%] font-semibold">
          {children}
        </div>
        <div className="absolute inset-0 inline-flex h-full w-full translate-y-[100%] items-center justify-center text-white transition-transform duration-300 group-hover:translate-y-0 font-semibold">
          <span className="absolute h-full w-full translate-y-full skew-y-12 scale-y-0 bg-x-accent transition-transform duration-300 group-hover:translate-y-0 group-hover:scale-150" />
          <span className="z-10 relative text-white">{children}</span>
        </div>
      </Link>
    );
  }
);

Button6.displayName = "Button6";
