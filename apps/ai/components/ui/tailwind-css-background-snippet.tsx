import { cn } from "@/lib/utils";

export const HeroBackgroundSnippet = ({ className }: { className?: string }) => {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden z-0", className)}>
      {/* Light Mode Radial Aurora Layer (Cross-fades smoothly on theme toggle) */}
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(125%_125%_at_50%_10%,#ffffff_25%,#eef2ff_60%,#c7d2fe_100%)] opacity-100 transition-opacity duration-300 dark:opacity-0" />

      {/* Dark Mode Radial Aurora Layer (Cross-fades smoothly on theme toggle) */}
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(125%_125%_at_50%_10%,#000000_30%,#0a0e27_60%,#4f46e5_100%)] opacity-0 transition-opacity duration-300 dark:opacity-100" />

      {/* Cyan scanner aura glow spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(50% 50% at 72% 45%, rgba(56,189,248,0.28), transparent 75%)",
        }}
      />

      {/* Violet headline accent aura glow spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(45% 45% at 25% 40%, rgba(99,102,241,0.22), transparent 75%)",
        }}
      />
    </div>
  );
};
