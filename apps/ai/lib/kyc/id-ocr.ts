"use client";

import type { DocType } from "@/lib/kyc/document-types";
import { docMeta } from "@/lib/kyc/document-types";

/**
 * Best-effort text extraction from an ID photo, using Tesseract.js — runs
 * entirely in the browser (WASM), so the photo never leaves the device for
 * this step. Deliberately scoped to National ID and Alien ID only: those two
 * share a layout this file's heuristics are written against. The other
 * document types (KRA PIN, Bank, Driving License, Plate) have layouts nobody
 * has tuned these rules against, so attempting them would mean guessing with
 * no evidence it'd work — worse than not trying, since a confidently-wrong
 * guess is more dangerous than an honest blank field. Extend
 * OCR_SUPPORTED_DOC_TYPES if/when those layouts are known.
 *
 * This is a *pre-fill*, never an auto-submit: id-scan-dialog.tsx still shows
 * the zoomed capture next to the (now pre-filled, still editable) inputs and
 * requires the operator to confirm before the details can be applied. A
 * wrong OCR read is a bad pre-fill an operator corrects, not bad data that
 * reaches a KYC record un-reviewed.
 *
 * IMPORTANT, learned from testing against real ID photos (not just the
 * placeholder sample-id.png): the small printed labels ("ID NUMBER", "FULL
 * NAMES") are the first thing to get mangled by OCR — they're much smaller
 * print than the values next to them, and easily lost to the card's security
 * watermark. The actual values (the ID number, the name) routinely read back
 * perfectly even when their labels are unrecognisable garbage. Two
 * consequences follow, both reflected below:
 *   1. Extraction does NOT require finding the literal label text — it uses
 *      the card's fixed structure instead (see extractDocNumber/
 *      extractLastName for exactly what that means for each field).
 *   2. Confidence is gated per-word (via Tesseract's word-level boxes, which
 *      the plain top-level `recognize()` doesn't return — hence the
 *      Worker + `{ blocks: true }` below), not by the whole document's
 *      average confidence. A garbled label sitting right next to a
 *      perfectly-read value should not veto that value; averaging them
 *      together into one document-wide score was doing exactly that.
 */

export type OcrFields = {
  docNumber: string | null;
  lastName: string | null;
};

/** Per-word confidence (0-100) floors. docNumber is verification-critical
 * (sent to Creditinfo) and held to a higher bar than lastName, which the
 * form's own copy says is "for your reference — not sent to Creditinfo". */
const DOC_NUMBER_CONFIDENCE_FLOOR = 60;
const LAST_NAME_CONFIDENCE_FLOOR = 55;

const OCR_SUPPORTED_DOC_TYPES: ReadonlySet<DocType> = new Set(["national_id", "alien_id"]);

export function isOcrSupported(docType: DocType): boolean {
  return OCR_SUPPORTED_DOC_TYPES.has(docType);
}

/**
 * Grayscale + a light blur, then a contrast boost, at up to 1600px wide.
 *
 * ID cards carry a security-pattern watermark (fine diagonal lines, a coat
 * of arms) behind the printed text, which raw OCR reads as noise mixed in
 * with real characters. The blur pass runs first and specifically targets
 * that: printed text is bold, few-pixel-wide strokes, while the watermark is
 * a much finer repeating pattern — a small box blur smears the fine pattern
 * toward a flat mid-gray while barely softening the bold strokes. The
 * contrast boost then runs on the *blurred* image, which pushes that
 * now-flat watermark region toward white while pulling the still-relatively-
 * dark text strokes toward black. This deliberately stops short of full
 * binarization (pure black/white per pixel) — that would suppress the
 * watermark further but risks erasing faint strokes on a lower-quality
 * photo, a worse failure mode than some leftover background pattern.
 */
async function preprocessForOcr(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const blurred = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += gray[ny * w + nx];
          count++;
        }
      }
      blurred[y * w + x] = sum / count;
    }
  }

  const contrast = 1.5;
  for (let p = 0, i = 0; p < blurred.length; p++, i += 4) {
    const boosted = Math.min(255, Math.max(0, (blurred[p] - 128) * contrast + 128));
    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
  }

  ctx.putImageData(new ImageData(data, w, h), 0, 0);
  return canvas.toDataURL("image/png");
}

type FlatWord = { text: string; confidence: number };

export type RawOcrResult = { text: string; words: FlatWord[] };

/** Looks up the per-word confidence for a token by its digit/letter content
 * (Tesseract's own tokenisation doesn't always line up with our regex
 * matches exactly, so this compares normalised content, not exact string
 * equality). Missing entirely counts as 0 confidence, not a free pass. */
function confidenceOf(words: FlatWord[], rawToken: string, normalize: (s: string) => string): number {
  const target = normalize(rawToken);
  const hit = words.find((w) => normalize(w.text) === target && target.length > 0);
  return hit?.confidence ?? 0;
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const onlyLetters = (s: string) => s.replace(/[^A-Za-z]/g, "");

/**
 * The Serial Number and ID Number print on the same line, Serial Number
 * first, ID Number second — true on every Kenyan National/Alien ID sample
 * this was tested against, and far more OCR-durable than the "ID NUMBER"
 * label itself, which is small enough print to reliably get lost in the
 * card's watermark. So: find the line with (at least) two long digit runs on
 * it, take the *last* one as the ID number, and validate it against the
 * document type's own pattern before accepting it — that pattern check is
 * what catches a line that turns out not to be the serial/ID line at all.
 */
function extractDocNumber(raw: RawOcrResult, docType: DocType): string | null {
  const meta = docMeta[docType];
  const lines = raw.text.split(/\r?\n/);

  for (const line of lines) {
    const digitRuns = line.match(/\d{6,10}/g);
    if (!digitRuns || digitRuns.length < 2) continue;

    const candidateRaw = digitRuns[digitRuns.length - 1];
    const candidate = meta.normalize(candidateRaw);
    if (!meta.pattern.test(candidate)) continue;

    if (confidenceOf(raw.words, candidateRaw, onlyDigits) >= DOC_NUMBER_CONFIDENCE_FLOOR) {
      return candidate;
    }
  }
  return null;
}

/** Lines that are structurally name-shaped (2+ words, all letters, on their
 * own line, in this card's font — which OCR reads as uppercase) but aren't
 * actually a name: the bilingual header is the only other line on the card
 * that looks like this. */
const NON_NAME_LINE = /REPUBLIC|KENYA|JAMHURI/i;

/**
 * Same reasoning as extractDocNumber: the "FULL NAMES" label is small print
 * that routinely doesn't survive OCR at all, while the name itself — larger,
 * bolder print — usually reads back cleanly. Rather than anchoring on the
 * label, this looks for a line that's structurally a name (2-4 words, each
 * 3+ letters) and isn't the bilingual "JAMHURI YA KENYA / REPUBLIC OF KENYA"
 * header, which is the only other line shaped like this. The surname's
 * position isn't standardised enough to pick out precisely, so this takes
 * the last qualifying word — acceptable given the field is explicitly for
 * the operator's own reference, not sent to Creditinfo.
 */
function extractLastName(raw: RawOcrResult): string | null {
  const lines = raw.text.split(/\r?\n/).map((l) => l.trim());

  for (const line of lines) {
    if (NON_NAME_LINE.test(line)) continue;

    const words = line.split(/\s+/).filter((w) => /^[A-Za-z'-]{3,}$/.test(w));
    if (words.length < 2) continue;

    const surname = words[words.length - 1];
    if (confidenceOf(raw.words, surname, onlyLetters) >= LAST_NAME_CONFIDENCE_FLOOR) {
      return surname[0].toUpperCase() + surname.slice(1).toLowerCase();
    }
  }
  return null;
}

/**
 * Runs Tesseract once and hands back the raw text plus a flat list of
 * per-word confidences. Split out from field-parsing because the capture
 * dialog only lets the operator pick the document type in the *details*
 * step, which happens after this already ran against whatever type was
 * selected by default — caching the raw result lets switching between
 * National ID and Alien ID re-parse instantly via `parseIdFields` instead of
 * re-running OCR.
 *
 * Uses a manually created Worker (rather than the top-level `recognize()`
 * convenience function) specifically to pass `{ blocks: true }` — without
 * it, Tesseract only returns the whole-page text and one averaged
 * confidence number, with no way to ask "how confident was it about just
 * this one word".
 */
export async function runOcr(imageDataUrl: string): Promise<RawOcrResult> {
  // Loaded on demand — Tesseract's WASM binary + English trained data is a
  // few MB and has no reason to be in the initial page bundle.
  const { createWorker } = await import("tesseract.js");
  const preprocessed = await preprocessForOcr(imageDataUrl);

  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(preprocessed, {}, { blocks: true });
    const words: FlatWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          for (const word of line.words ?? []) {
            words.push({ text: word.text, confidence: word.confidence });
          }
        }
      }
    }

    return { text: data.text, words };
  } finally {
    await worker.terminate();
  }
}

export function parseIdFields(raw: RawOcrResult, docType: DocType): OcrFields {
  if (!isOcrSupported(docType)) {
    return { docNumber: null, lastName: null };
  }
  return {
    docNumber: extractDocNumber(raw, docType),
    lastName: extractLastName(raw),
  };
}
