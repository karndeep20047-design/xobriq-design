import { ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  speed?: number; // seconds for one full loop
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
};

// Pure CSS loop (see .marquee-track in globals.css) — no framer-motion, no
// per-frame JS. Doesn't need "use client" for that reason either; this
// renders identically on the server.
export function Marquee({
  children,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className = "",
}: Props) {
  return (
    <div
      className={"overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] " + className}
    >
      <div
        className={
          "marquee-track flex w-max gap-16 whitespace-nowrap " +
          (direction === "right" ? "[animation-direction:reverse] " : "") +
          (pauseOnHover ? "marquee-pause-on-hover " : "")
        }
        style={{ "--marquee-duration": `${speed}s` } as CSSProperties}
      >
        {/* Exactly two copies — the keyframe travels exactly -50% of this
            track's width, which is only the seamless loop point when the
            track is precisely double the single-copy width. */}
        <div className="flex shrink-0 gap-16">{children}</div>
        <div className="flex shrink-0 gap-16" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
