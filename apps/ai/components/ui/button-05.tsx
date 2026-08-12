"use client";

import * as React from "react";
import Link from "next/link";

interface Button05Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const Button05 = React.forwardRef<HTMLAnchorElement, Button05Props>(
  ({ href, children, className = "", ...props }, ref) => {
    const renderDots = () => {
      const dotValues = [2, 1, 0, 1, 2];
      return dotValues.map((value, index) => (
        <span
          key={`dot-${index}`}
          className="button05_dot"
          style={{ "--index": value } as React.CSSProperties}
        />
      ));
    };

    const renderIcons = () => {
      return [3, 2, 1, 0].map((indexParent) => (
        <span
          key={`icon-${indexParent}`}
          className="button05_icon"
          style={{ "--index-parent": indexParent } as React.CSSProperties}
        >
          {renderDots()}
        </span>
      ));
    };

    return (
      <Link
        ref={ref}
        href={href}
        className={`button05 group ${className}`}
        {...props}
      >
        <span className="button05_bg" />
        <span className="button05_inner">
          <span className="button05_text">{children}</span>
          <span className="button05_icon-wrap">{renderIcons()}</span>
        </span>
      </Link>
    );
  }
);

Button05.displayName = "Button05";
