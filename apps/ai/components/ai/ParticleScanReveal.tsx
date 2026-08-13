"use client";

import { useEffect, useRef } from "react";

export type ParticleScanRevealProps = {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  grid?: number;
  skinChroma?: number;
  rimRatio?: number;
  brushRadius?: number;
  showGrid?: boolean;
  restingOpacity?: number;
  photoFilter?: string;
  introScan?: boolean;
  introDelay?: number;
  scanLoop?: boolean;
};

// Precisely calibrated facial landmarks [x, y] mapped to hero portrait (range 0..1)
const FACE_NODES: [number, number][] = [
  // Forehead arch & hairline (0..4)
  [0.50, 0.23], [0.42, 0.25], [0.58, 0.25], [0.34, 0.29], [0.66, 0.29],
  // Eyebrows (5..10)
  [0.33, 0.34], [0.39, 0.332], [0.45, 0.338],
  [0.55, 0.338], [0.61, 0.332], [0.67, 0.34],
  // Left Eye socket & Iris pupil center (11..15)
  [0.325, 0.395], [0.385, 0.385], [0.445, 0.395], [0.385, 0.405], [0.385, 0.395],
  // Right Eye socket & Iris pupil center (16..20)
  [0.555, 0.395], [0.615, 0.385], [0.675, 0.395], [0.615, 0.405], [0.615, 0.395],
  // Nose Bridge, Tip & Nostrils (21..26)
  [0.50, 0.35], [0.50, 0.41], [0.50, 0.46], [0.50, 0.505], [0.455, 0.515], [0.545, 0.515],
  // Cheekbones & Temples (27..32)
  [0.26, 0.37], [0.29, 0.46], [0.33, 0.53],
  [0.74, 0.37], [0.71, 0.46], [0.67, 0.53],
  // Lips / Mouth Contour (33..42)
  [0.415, 0.585], [0.46, 0.575], [0.50, 0.572], [0.54, 0.575], [0.585, 0.585],
  [0.54, 0.602], [0.50, 0.608], [0.46, 0.602],
  [0.45, 0.585], [0.55, 0.585],
  // Jawline & Chin (43..51)
  [0.27, 0.49], [0.31, 0.58], [0.38, 0.65], [0.44, 0.678],
  [0.50, 0.688],
  [0.56, 0.678], [0.62, 0.65], [0.69, 0.58], [0.73, 0.49],
];

// Triangulation mesh edge connections [nodeIndexA, nodeIndexB]
const MESH_EDGES: [number, number][] = [
  // Forehead arch connections
  [0, 1], [0, 2], [1, 3], [2, 4], [0, 21],
  [1, 6], [2, 9], [3, 5], [4, 10], [1, 21], [2, 21],
  // Eyebrows
  [5, 6], [6, 7], [8, 9], [9, 10], [7, 21], [8, 21],
  // Left Eye Loop & Brow connections
  [11, 12], [12, 13], [13, 14], [14, 11], [12, 15], [14, 15],
  [5, 11], [6, 12], [7, 13], [11, 27], [13, 21],
  // Right Eye Loop & Brow connections
  [16, 17], [17, 18], [18, 19], [19, 16], [17, 20], [19, 20],
  [8, 18], [9, 17], [10, 16], [16, 30], [18, 21],
  // Nose Bridge & Connections to Eyes / Cheeks
  [21, 22], [22, 23], [23, 24], [24, 25], [24, 26], [25, 26],
  [13, 22], [18, 22], [13, 23], [18, 23], [14, 28], [19, 31],
  [25, 28], [26, 31], [24, 34], [24, 36],
  // Cheekbones & Jaw Contour
  [27, 28], [28, 29], [29, 43], [43, 44], [44, 45], [45, 46], [46, 47],
  [30, 31], [31, 32], [32, 51], [51, 50], [50, 49], [49, 48], [48, 47],
  [28, 33], [31, 37], [29, 44], [32, 50],
  // Mouth Loop & Connections to Nose and Chin
  [33, 34], [34, 35], [35, 36], [36, 37], [37, 38], [38, 39], [39, 40], [40, 33],
  [33, 41], [37, 42], [41, 42],
  [35, 24], [39, 46], [39, 47], [39, 48],
];

export function ParticleScanReveal({
  src,
  alt,
  className = "",
  style,
  photoFilter = "none",
  scanLoop = true,
}: ParticleScanRevealProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;

    // Node excitation levels (0..1)
    const excitations = new Float32Array(FACE_NODES.length);
    let pointerPos: { x: number; y: number } | null = null;

    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.height);
      if (!width || !height) return;

      const isMobile = window.innerWidth < 640;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const onPointerMove = (e: PointerEvent) => {
      // Disable hover/touch pointer excitation on mobile screens (< 768px)
      if (window.innerWidth < 768 || e.pointerType === "touch") {
        pointerPos = null;
        return;
      }

      const rect = host.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (px >= 0 && px <= rect.width && py >= 0 && py <= rect.height) {
        pointerPos = { x: px, y: py };
      } else {
        pointerPos = null;
      }
    };

    const onVisibilityOrBlur = () => {
      pointerPos = null;
      excitations.fill(0);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("visibilitychange", onVisibilityOrBlur);
    window.addEventListener("blur", onVisibilityOrBlur);

    let lastTime = 0;

    const render = (now: number) => {
      if (!isVisible || !width || !height) {
        return;
      }

      const dt = lastTime ? Math.min((now - lastTime) / 16.67, 2) : 1;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Dual Laser Beam Sweep calculation (5.5s smooth period, centered scan window)
      const SCAN_PERIOD = 5500;
      const progress = scanLoop ? (now % SCAN_PERIOD) / SCAN_PERIOD : 0.5;
      const scanY = progress * height;
      const beamCenterY = scanY - 38;
      const influenceRadius = 75;

      // Position DOM dual laser lines with smooth hardware translate3d (no CSS transition conflict)
      if (scanLineRef.current) {
        scanLineRef.current.style.transform = `translate3d(0, ${scanY.toFixed(1)}px, 0)`;
        scanLineRef.current.style.opacity = progress < 0.02 || progress > 0.98 ? "0" : "1";
      }

      // 2. Silky Smooth Continuous Falloff Excitation
      const attackFactor = 1 - Math.pow(0.82, dt);
      const decayFactor = Math.pow(0.70, dt);

      for (let i = 0; i < FACE_NODES.length; i++) {
        const [nx, ny] = FACE_NODES[i];
        const nodeY = ny * height;
        const nodeX = nx * width;

        // Smooth cosine bell-curve falloff from the scan beam
        const distY = Math.abs(nodeY - beamCenterY);
        let targetExcite = 0;

        if (distY < influenceRadius) {
          const normDist = distY / influenceRadius;
          targetExcite = Math.cos(normDist * Math.PI * 0.5);
          targetExcite = Math.pow(targetExcite, 1.2);
        }

        // Pointer proximity smooth excitation
        if (pointerPos) {
          const distPtr = Math.hypot(nodeX - pointerPos.x, nodeY - pointerPos.y);
          if (distPtr < 140) {
            const ptrNorm = distPtr / 140;
            const ptrExcite = Math.cos(ptrNorm * Math.PI * 0.5);
            targetExcite = Math.max(targetExcite, Math.pow(ptrExcite, 1.5));
          }
        }

        // Silky smooth attack (lerp) & rapid clean decay
        if (targetExcite > excitations[i]) {
          excitations[i] += (targetExcite - excitations[i]) * attackFactor;
        } else {
          excitations[i] *= decayFactor;
        }
      }

      // 3. Draw Triangulation Mesh Edges with Smooth Alpha & Width Interpolation
      for (const [idxA, idxB] of MESH_EDGES) {
        const [ax, ay] = FACE_NODES[idxA];
        const [bx, by] = FACE_NODES[idxB];
        const p1x = ax * width;
        const p1y = ay * height;
        const p2x = bx * width;
        const p2y = by * height;

        const exciteA = excitations[idxA];
        const exciteB = excitations[idxB];
        const edgeExcite = Math.max(exciteA, exciteB);

        if (edgeExcite < 0.01) continue;

        const smoothAlpha = Math.pow(edgeExcite, 1.3) * 0.85;
        ctx.lineWidth = 0.8 + edgeExcite * 0.6;

        ctx.strokeStyle = edgeExcite > 0.5
          ? `rgba(255, 255, 255, ${smoothAlpha})`
          : `rgba(63, 169, 255, ${smoothAlpha})`;

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
      }

      // 4. Draw Facial Landmark Nodes with Smooth Radius & Soft Radial Glow
      for (let i = 0; i < FACE_NODES.length; i++) {
        const excite = excitations[i];
        if (excite < 0.01) continue;

        const [nx, ny] = FACE_NODES[i];
        const nodeX = nx * width;
        const nodeY = ny * height;

        const baseRadius = 1.8;
        const radius = baseRadius + excite * 2.6;
        const alpha = Math.pow(excite, 1.2);

        // Soft radial glow sprite
        const glowGrad = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, radius * 3.8);
        glowGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        glowGrad.addColorStop(0.3, `rgba(63, 169, 255, ${alpha * 0.75})`);
        glowGrad.addColorStop(1, "rgba(63, 169, 255, 0)");

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius * 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid node point
        ctx.fillStyle = excite > 0.3 ? "#ffffff" : `rgba(180, 230, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("visibilitychange", onVisibilityOrBlur);
      window.removeEventListener("blur", onVisibilityOrBlur);
    };
  }, [scanLoop]);

  return (
    <div ref={hostRef} style={style} className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Base portrait photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        fetchPriority="high"
        className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover"
        style={{ filter: photoFilter }}
      />

      {/* Face Mesh Canvas Overlay */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10" />

      {/* Dual Synchronized Laser Beam Lines */}
      <div
        ref={scanLineRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
      >
        <div className="relative w-full">
          {/* Line 1: Secondary trailing echo line (76px above primary line) */}
          <div className="absolute inset-x-0 -top-19 h-px bg-[#3fa9ff]/60 shadow-[0_0_8px_rgba(63,169,255,0.6)]" />

          {/* Glowing scanner wash fill inside the 76px window between Line 1 and Line 2 */}
          <div className="absolute inset-x-0 -top-19 h-19 -mt-0 bg-gradient-to-b from-[#3fa9ff]/10 via-[#3fa9ff]/25 to-[#3fa9ff]/45 border-b border-[#3fa9ff]/50" />

          {/* Line 2: Primary laser beam line */}
          <div className="h-0.5 w-full bg-[#3fa9ff] shadow-[0_0_14px_#3fa9ff,0_0_28px_rgba(63,169,255,0.95)]" />
        </div>
      </div>

      {/* Futuristic HUD Bounding Box Frame (Sized to fit 100% inside the circular circle frame) */}
      <div className="pointer-events-none absolute inset-x-[20%] top-[19%] bottom-[19%] z-30 rounded-lg border border-sky-400/40 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]">
        {/* Top-Left Corner Reticle */}
        <div className="absolute -left-0.5 -top-0.5 h-3 w-3 border-l-2 border-t-2 border-sky-400" />
        <span className="absolute left-1 top-1 font-mono text-[7.5px] sm:text-[8.5px] font-bold tracking-tight text-sky-400">
          + BIOMETRIC ID SCAN
        </span>

        {/* Top-Right Corner Reticle */}
        <div className="absolute -right-0.5 -top-0.5 h-3 w-3 border-r-2 border-t-2 border-sky-400" />
        <span className="absolute right-1 top-1 font-mono text-[7.5px] sm:text-[8.5px] font-semibold text-slate-200/90">
          SYS_OK // 68 NODES
        </span>

        {/* Bottom-Left Corner Reticle */}
        <div className="absolute -bottom-0.5 -left-0.5 h-3 w-3 border-b-2 border-l-2 border-sky-400" />
        <div className="absolute bottom-1 left-1 flex items-center gap-1 font-mono text-[7.5px] sm:text-[8.5px] font-bold text-sky-400">
          <span className="h-1 w-1 rounded-full bg-sky-400 animate-pulse" />
          <span>ANALYZING DATA</span>
        </div>

        {/* Bottom-Right Corner Reticle */}
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-b-2 border-r-2 border-sky-400" />
        <span className="absolute bottom-1 right-1 font-mono text-[7.5px] sm:text-[8.5px] font-semibold text-emerald-400">
          + MATCH: 99.8%
        </span>

        {/* Right Vertical Measurement Ruler Ticks */}
        <div className="absolute -right-4 top-4 bottom-4 flex flex-col justify-between font-mono text-[6.5px] text-sky-400/60 hidden sm:flex">
          <span>010mm</span>
          <span>020mm</span>
          <span>030mm</span>
          <span>040mm</span>
          <span>050mm</span>
        </div>

        {/* Left Vertical Measurement Ticks */}
        <div className="absolute -left-2 top-6 bottom-6 flex flex-col justify-between hidden sm:flex">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-px w-1.5 bg-sky-400/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
