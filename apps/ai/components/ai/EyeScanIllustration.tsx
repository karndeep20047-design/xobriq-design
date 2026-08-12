"use client";

export function EyeScanIllustration() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-enterprise-primary/25 via-enterprise-bg-lower to-enterprise-accent/20">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b5c4ff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0a3dff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#050a14" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#050a14" />
            <stop offset="80%" stopColor="#0a1322" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
        </defs>

        {/* outer scan rings */}
        <circle cx="150" cy="150" r="140" fill="none" stroke="#b5c4ff" strokeOpacity="0.15" strokeDasharray="4 4" />
        <circle cx="150" cy="150" r="120" fill="none" stroke="#b5c4ff" strokeOpacity="0.2" strokeDasharray="2 6" />

        {/* iris */}
        <circle cx="150" cy="150" r="90" fill="url(#iris)" />

        {/* iris texture — radial lines */}
        {Array.from({ length: 40 }).map((_, i) => {
          const a = (i / 40) * Math.PI * 2;
          const x1 = 150 + Math.cos(a) * 40;
          const y1 = 150 + Math.sin(a) * 40;
          const x2 = 150 + Math.cos(a) * 88;
          const y2 = 150 + Math.sin(a) * 88;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b5c4ff" strokeOpacity="0.35" strokeWidth="0.6" />;
        })}

        {/* pupil */}
        <circle cx="150" cy="150" r="35" fill="url(#pupil)" />
        <circle cx="140" cy="140" r="6" fill="#ffffff" fillOpacity="0.35" />
      </svg>

      {/* vertical scan bars */}
      <div className="pointer-events-none absolute inset-y-0 left-[22%] w-[2px] bg-enterprise-accent/70 shadow-[0_0_12px_rgba(181,196,255,0.7)]" />
      <div className="pointer-events-none absolute inset-y-0 right-[22%] w-[2px] bg-enterprise-accent/70 shadow-[0_0_12px_rgba(181,196,255,0.7)]" />

      {/* sweeping scan line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-enterprise-accent to-transparent opacity-70 [animation:sweep_3s_ease-in-out_infinite]" />

      <style>{"@keyframes sweep { 0%,100% { top: 5%; opacity: 0.2 } 50% { top: 95%; opacity: 0.9 } }"}</style>
    </div>
  );
}