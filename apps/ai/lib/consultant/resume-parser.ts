// apps/ai/lib/consultant/resume-parser.ts
//
// Best-effort CV text extraction + heuristic field guessing, used only to
// pre-fill the application form as a convenience. This is regex/keyword
// based, not ML-grade parsing — it WILL miss things and get things wrong on
// unusual CV layouts. Nothing here is trusted as authoritative: the
// applicant's own typed/confirmed field values are what's validated and
// stored, never the raw extraction output.
import "server-only";
import yauzl from "yauzl";
import type { CVExtension } from "./file-validation";

export type ExtractedFields = {
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experienceYears?: number;
  jobBackground?: string;
};

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Imported lazily, not at module scope: pdf-parse (via pdfjs-dist)
  // references the browser-only DOMMatrix global during module evaluation,
  // which crashes on the server before this function ever runs. A static
  // top-level import would break every Server Action in this "use server"
  // file, not just CV extraction, since Next.js evaluates the whole module
  // to invoke any one action from it. Deferring the import means a broken
  // pdf-parse only fails PDF pre-fill (caught below), not the whole submit.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function stripXmlTags(xml: string): string {
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractDocxText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(new Error("Could not read DOCX"));

      let found = false;
      zipfile.on("entry", (entry) => {
        if (entry.fileName !== "word/document.xml") {
          zipfile.readEntry();
          return;
        }
        found = true;
        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) return reject(new Error("Could not read DOCX content"));
          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(chunk as Buffer));
          stream.on("end", () => resolve(stripXmlTags(Buffer.concat(chunks).toString("utf-8"))));
          stream.on("error", () => reject(new Error("Could not read DOCX content")));
        });
      });
      zipfile.on("end", () => {
        if (!found) reject(new Error("DOCX has no document content"));
      });
      zipfile.on("error", () => reject(new Error("Could not read DOCX")));
      zipfile.readEntry();
    });
  });
}

// Best-effort only — returns "" on any failure (including legacy .doc,
// which isn't supported here) rather than blocking the submission. The
// applicant can always fill the form manually.
export async function extractCVText(buffer: Buffer, extension: CVExtension): Promise<string> {
  try {
    if (extension === "pdf") return await extractPdfText(buffer);
    if (extension === "docx") return await extractDocxText(buffer);
    return ""; // legacy .doc — not supported by the parsing libraries in use
  } catch {
    return "";
  }
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,17}\d)/;
const EDUCATION_KEYWORDS = /(bachelor|master|msc|bsc|phd|doctorate|diploma|b\.?a\.?|m\.?a\.?|university|institute|college)/i;
const JOB_SECTION_RE = /(work experience|employment history|professional experience|experience)\s*:?\s*\n/i;
const EXPLICIT_YEARS_RE = /(\d{1,2})\+?\s*years?\s+(of\s+)?(experience|exp\.?)/i;

function guessName(text: string): string | undefined {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length > 60 || /[@\d]/.test(line)) continue;
    if (/^(curriculum vitae|resume|cv|profile|summary)$/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][\p{L}'.-]*$/u.test(w))) {
      return line;
    }
  }
  return undefined;
}

function guessEducation(text: string): string | undefined {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => EDUCATION_KEYWORDS.test(l));
  if (idx === -1) return undefined;
  return [lines[idx], lines[idx + 1]].filter(Boolean).join(" — ").slice(0, 300);
}

function guessExperienceYears(text: string): number | undefined {
  const explicit = text.match(EXPLICIT_YEARS_RE);
  if (explicit) {
    const n = parseInt(explicit[1], 10);
    if (n >= 0 && n <= 60) return n;
  }
  // Fallback: span between the earliest and latest plausible 4-digit year
  // mentioned in the document (e.g. from a work-history date range).
  const currentYear = new Date().getFullYear();
  const years = Array.from(text.matchAll(/\b(19[7-9]\d|20[0-4]\d)\b/g))
    .map((m) => parseInt(m[1], 10))
    .filter((y) => y >= 1970 && y <= currentYear);
  if (years.length < 2) return undefined;
  const span = Math.max(...years) - Math.min(...years);
  return span > 0 && span <= 50 ? span : undefined;
}

function guessJobBackground(text: string): string | undefined {
  const match = text.match(JOB_SECTION_RE);
  if (!match || match.index === undefined) return undefined;
  const start = match.index + match[0].length;
  return text.slice(start, start + 500).trim() || undefined;
}

export function extractFieldsFromText(text: string): ExtractedFields {
  if (!text.trim()) return {};

  const email = text.match(EMAIL_RE)?.[0];
  const phone = text.match(PHONE_RE)?.[0]?.trim();

  return {
    name: guessName(text),
    email,
    phone,
    education: guessEducation(text),
    experienceYears: guessExperienceYears(text),
    jobBackground: guessJobBackground(text),
  };
}
