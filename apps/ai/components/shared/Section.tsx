// ============================================================================
//  Section — consistent vertical rhythm + max-width across all pages
//  Responsive padding: tight on mobile, generous on desktop
// ============================================================================
import { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div" | "article";
};

export function Section({
  children,
  className = "",
  id,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={"px-5 py-16 sm:px-6 md:py-20 lg:py-24 " + className}
    >
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </Tag>
  );
}