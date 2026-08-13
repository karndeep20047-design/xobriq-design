import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

// Self-hosted via next/font (built at compile time, served from our own
// origin) rather than xobriq.com's Google Fonts <link>/@import approach —
// same fonts, but no CSP font-src/
// style-src allowance needed for fonts.googleapis.com.
// 2026 redesign type system — a three-part pairing:
//   Space Grotesk  display/headings — a technical grotesque with real
//                  personality at large sizes (the distinctive g/a/k), which
//                  suits an AI-infrastructure brand without tipping novelty.
//   Inter          body — the neutral, highly legible workhorse; deliberately
//                  characterless so it never competes with the headings.
//   JetBrains Mono micro-labels — carries the .x-label uppercase tags that
//                  are the recurring typographic tell of the new design.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-face",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xobriq.ai — AI APIs, Agents & GPU Infrastructure",
  description:
    "Xobriq Technologies — East Africa's enterprise AI cybersecurity company. Guard fraud APIs, Agentic AI, DGX H200 GPU cloud, AI consulting and managed cyber.",
  // Set here, on the root layout, so it applies to every route in the app —
  // marketing pages, auth, console, dashboard, KYC — none of them define
  // their own `icons`, so this is the one favicon for the whole site.
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={display.variable + " " + body.variable + " " + mono.variable}
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('xobriq-theme');
                var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && supportDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-bg text-fg antialiased">
        {/* Meta Pixel moved out of the root layout — it now only renders
            from (public)/(auth)/(docs)'s own layouts (components/shared/
            MetaPixel.tsx), the actual visitor-facing marketing surfaces.
            See that file's comment for why. */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}