// apps/ai/lib/consultant/file-validation.ts
//
// Security gate for consultant CV uploads. This endpoint is public and
// anonymous (unlike the console's staff-only cover-image upload), so every
// check here is a hard gate, not a courtesy filter:
//   - Extension and content (magic bytes) must both match a known-good CV
//     format. The filename/extension the browser reports is never trusted
//     alone — a renamed executable or script won't pass the byte check.
//   - DOCX (a zip archive) is structurally verified and each entry's
//     declared uncompressed size is checked BEFORE decompression, so a
//     maliciously crafted archive can't exhaust memory (zip-bomb guard).
//   - The original filename is never used to build a storage path — the
//     caller always generates its own key — so path traversal / null-byte
//     tricks in the filename have nothing to act on.
import "server-only";
import yauzl from "yauzl";

export type CVExtension = "pdf" | "doc" | "docx";

export type ValidatedFile = {
  buffer: Buffer;
  extension: CVExtension;
};

export class FileValidationError extends Error {}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
// Generous but bounded ceiling for a single decompressed entry in a DOCX —
// resumes are text documents, not archives; a legitimate one is nowhere
// near this, and it stops a single maliciously inflated entry from
// exhausting memory even though the compressed upload itself is capped.
const MAX_DOCX_ENTRY_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set(["pdf", "doc", "docx"]);

// Extensions that make a filename look like it's hiding its real type
// behind a second, trusted-looking extension (e.g. "cv.exe.pdf"). We never
// use the client filename for storage, but a name shaped like this is
// still worth rejecting outright rather than silently accepting.
const SUSPICIOUS_MIDDLE_EXTENSIONS: ReadonlySet<string> = new Set([
  "exe", "sh", "bat", "cmd", "com", "scr", "js", "vbs", "ps1",
  "jar", "app", "msi", "html", "htm", "svg", "php", "dll", "wsf",
]);

const PDF_SIGNATURE = Buffer.from("25504446", "hex"); // "%PDF"
const DOC_SIGNATURE = Buffer.from("d0cf11e0a1b11ae1", "hex"); // OLE2 compound file (legacy .doc)
const ZIP_SIGNATURE = Buffer.from("504b0304", "hex"); // "PK\x03\x04" — docx is a zip

function safeExtension(filename: string): string | null {
  if (!filename || filename.includes("\0") || filename.includes("/") || filename.includes("\\")) {
    return null;
  }
  const parts = filename.split(".");
  if (parts.length < 2) return null;

  const ext = parts[parts.length - 1].toLowerCase();
  if (parts.length > 2) {
    const secondToLast = parts[parts.length - 2].toLowerCase();
    if (SUSPICIOUS_MIDDLE_EXTENSIONS.has(secondToLast)) return null;
  }
  return ext;
}

// Structural check only — confirms this is a real OOXML docx and that no
// entry claims an absurd size. Does not extract text (that's a separate,
// best-effort step that's allowed to fail softly after this passes).
function verifyDocxStructure(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(new FileValidationError("File content does not match a valid DOCX file"));
        return;
      }

      let sawContentTypes = false;
      let sawDocument = false;

      zipfile.on("entry", (entry) => {
        if (entry.uncompressedSize > MAX_DOCX_ENTRY_BYTES) {
          zipfile.close();
          reject(new FileValidationError("DOCX file contains an unexpectedly large entry"));
          return;
        }
        if (entry.fileName === "[Content_Types].xml") sawContentTypes = true;
        if (entry.fileName === "word/document.xml") sawDocument = true;
        zipfile.readEntry();
      });

      zipfile.on("end", () => {
        if (!sawContentTypes || !sawDocument) {
          reject(new FileValidationError("File content does not match a valid DOCX file"));
          return;
        }
        resolve();
      });

      zipfile.on("error", () => {
        reject(new FileValidationError("File content does not match a valid DOCX file"));
      });

      zipfile.readEntry();
    });
  });
}

export async function validateUploadedCV(file: File): Promise<ValidatedFile> {
  if (file.size === 0) throw new FileValidationError("File is empty");
  if (file.size > MAX_FILE_BYTES) throw new FileValidationError("File exceeds the 5MB limit");

  const ext = safeExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new FileValidationError("Only PDF, DOC, and DOCX files are accepted");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // The authoritative check: actual bytes must match the claimed type,
  // independent of filename, extension, or the browser-reported MIME type
  // (all three are attacker-controlled and never trusted alone).
  if (ext === "pdf") {
    if (!buffer.subarray(0, 4).equals(PDF_SIGNATURE)) {
      throw new FileValidationError("File content does not match a valid PDF");
    }
  } else if (ext === "doc") {
    if (!buffer.subarray(0, 8).equals(DOC_SIGNATURE)) {
      throw new FileValidationError("File content does not match a valid DOC file");
    }
  } else {
    if (!buffer.subarray(0, 4).equals(ZIP_SIGNATURE)) {
      throw new FileValidationError("File content does not match a valid DOCX file");
    }
    await verifyDocxStructure(buffer);
  }

  return { buffer, extension: ext as CVExtension };
}
