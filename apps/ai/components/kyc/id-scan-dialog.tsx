"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  FileImage,
  Lightbulb,
  Loader2,
  RotateCcw,
  ScanLine,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CAPTURABLE_DOC_TYPES,
  docMeta,
  type DocType,
} from "@/lib/kyc/document-types";
import { runOcr, parseIdFields, isOcrSupported, type RawOcrResult } from "@/lib/kyc/id-ocr";

/**
 * Capture an ID document and transcribe its details into the verification form.
 *
 * There is deliberately NO automatic text extraction or document-type
 * detection. This app has no OCR provider wired up, and a capture flow that
 * *appears* to read a document but actually guesses would put fabricated
 * identity data into a KYC record — the one thing this product exists to
 * prevent. So the document type is chosen by the operator and the number is
 * transcribed from the photo they just took, against a zoomable copy of it.
 *
 * Everything the progress ticker claims is real: `analyseCapture()` genuinely
 * decodes the image and measures resolution, exposure and focus, and a poor
 * result surfaces as a warning instead of a celebration. If OCR is added
 * later it slots in after the analysis and pre-fills the same inputs — the
 * confirm step stays regardless, because real OCR needs one too.
 */

export type CapturedIdFields = {
  docType: DocType;
  docNumber: string;
  lastName: string;
};

type Stage = "source" | "preview" | "scanning" | "success" | "details";
type SourceTab = "upload" | "camera";

type CaptureQuality = {
  width: number;
  height: number;
  brightness: number;
  sharpness: number;
  warnings: string[];
};

type PendingFile = {
  name: string;
  size: number;
  progress: number;
  status: "reading" | "done" | "error";
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const STEP_MIN_MS = 620;
const SUCCESS_HOLD_MS = 1700;

// ID-1 card ratio (85.6mm x 54mm). Must match the `aspect-[1.585]` Tailwind
// classes on the live video, the preview <img>, and the zoom view below —
// those crop/fit the same box visually, but only capturePhoto() actually
// discards the pixels outside it, so this is the one place that has to
// agree with all of them or the saved photo drifts from what the framing
// guide showed the operator.
const CAPTURE_ASPECT = 1.585;

// Forgiving on purpose — these should catch a genuinely unusable capture
// (thumb over the lens, a 200px thumbnail), not nag about a decent photo.
const MIN_WIDTH = 640;
const DARK_BELOW = 55;
const BLOWN_ABOVE = 210;
const SOFT_BELOW = 6;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Decodes the capture and measures it, on a 320px-wide downscale — plenty for
 * these statistics and well under a frame even for a 12MP phone photo.
 */
async function analyseCapture(dataUrl: string): Promise<CaptureQuality> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const sampleW = 320;
  const sampleH = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * sampleW));

  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const quality: CaptureQuality = {
    width: img.naturalWidth,
    height: img.naturalHeight,
    brightness: 128,
    sharpness: 100,
    warnings: [],
  };

  if (ctx) {
    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

    // Rec. 601 luma, kept flat so the sharpness pass can walk rows without
    // recomputing.
    const luma = new Float32Array(sampleW * sampleH);
    let sum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      luma[p] = y;
      sum += y;
    }
    quality.brightness = sum / luma.length;

    // Mean horizontal gradient. A blurred photo has soft edges everywhere, so
    // neighbouring pixels differ very little; a sharp one has hard transitions
    // at every character edge.
    let deltaSum = 0;
    let deltaCount = 0;
    for (let y = 0; y < sampleH; y++) {
      for (let x = 1; x < sampleW; x++) {
        const idx = y * sampleW + x;
        deltaSum += Math.abs(luma[idx] - luma[idx - 1]);
        deltaCount++;
      }
    }
    quality.sharpness = deltaCount ? deltaSum / deltaCount : 0;
  }

  if (quality.width < MIN_WIDTH) {
    quality.warnings.push("Low resolution — the number may be hard to read.");
  }
  if (quality.brightness < DARK_BELOW) {
    quality.warnings.push("Very dark. More light will make it easier to read.");
  } else if (quality.brightness > BLOWN_ABOVE) {
    quality.warnings.push("Washed out — try reducing glare on the card.");
  }
  if (quality.sharpness < SOFT_BELOW) {
    quality.warnings.push("Looks out of focus. A steadier shot will read better.");
  }

  return quality;
}

export function IdScanDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (fields: CapturedIdFields) => void;
}) {
  const [stage, setStage] = useState<Stage>("source");
  const [tab, setTab] = useState<SourceTab>("upload");
  const [cameraLive, setCameraLive] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [quality, setQuality] = useState<CaptureQuality | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // True for a brief moment right before leaving "scanning" — fades the
  // capture's scan overlay out instead of yanking it away mid-sweep. Real
  // OCR time is variable (1-4s+ depending on the photo), so it essentially
  // never lines up with a whole number of the scan-line's animation loops;
  // without this, the sweep always looked like it "stopped partway" because
  // it was being cut off mid-motion, not because anything was actually
  // broken.
  const [finishing, setFinishing] = useState(false);

  const [docType, setDocType] = useState<DocType>("national_id");
  const [docNumber, setDocNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [touched, setTouched] = useState(false);

  // Raw OCR text + confidence, cached so switching between National ID and
  // Alien ID in the details step re-parses instantly instead of re-running
  // Tesseract. autoFilled tracks which fields came from OCR (for the badge)
  // vs. the operator's own typing — cleared the moment they edit a field.
  const [rawOcr, setRawOcr] = useState<RawOcrResult | null>(null);
  const [autoFilled, setAutoFilled] = useState<{ docNumber: boolean; lastName: boolean }>({
    docNumber: false,
    lastName: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The camera stream is usually still hunting for focus in the instant
  // after it goes live, so a Capture tap in that window grabs a soft frame —
  // fine for a document number's bold digits, but frequently enough to blur
  // a multi-letter name past OCR's confidence floor to be the actual cause
  // reported for lastName misreads specifically coming from camera captures
  // (an uploaded photo, by contrast, came from the phone's own camera app,
  // which already waited out its own autofocus). This just makes the app
  // wait too, rather than trusting the first frame.
  const [cameraReady, setCameraReady] = useState(false);

  const meta = docMeta[docType];

  // Releasing the MediaStream is not optional — without it the camera stays
  // active (and the hardware indicator light stays on) after the dialog is
  // closed, which users reasonably read as the app spying on them.
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = null;
    setCameraLive(false);
    setCameraReady(false);
  }, []);

  // Covers unmount, which the onOpenChange path alone would miss.
  useEffect(() => stopCamera, [stopCamera]);

  const resetAll = useCallback(() => {
    stopCamera();
    setStage("source");
    setTab("upload");
    setImage(null);
    setPendingFile(null);
    setStepIndex(0);
    setQuality(null);
    setError(null);
    setDragging(false);
    setDocType("national_id");
    setDocNumber("");
    setLastName("");
    setTouched(false);
    setRawOcr(null);
    setAutoFilled({ docNumber: false, lastName: false });
    setFinishing(false);
  }, [stopCamera]);

  function handleOpenChange(next: boolean) {
    if (!next) resetAll();
    onOpenChange(next);
  }

  // ── File intake ──────────────────────────────────────────────────────
  const ingestFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That's not an image. Upload a JPG or PNG of the ID.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`That file is ${formatBytes(file.size)} — the limit is 8MB.`);
      return;
    }

    setError(null);
    setPendingFile({ name: file.name, size: file.size, progress: 0, status: "reading" });

    const reader = new FileReader();
    // Real progress from the FileReader, not a synthetic timer. Local reads
    // are usually near-instant; the row stays afterwards as the file entry.
    reader.onprogress = (e) => {
      if (!e.lengthComputable) return;
      setPendingFile((p) => (p ? { ...p, progress: e.loaded / e.total } : p));
    };
    reader.onload = () => {
      setImage(String(reader.result));
      setPendingFile((p) => (p ? { ...p, progress: 1, status: "done" } : p));
    };
    reader.onerror = () => {
      setPendingFile((p) => (p ? { ...p, status: "error" } : p));
      setError("Couldn't read that file. Try another image.");
    };
    reader.readAsDataURL(file);
  }, []);

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    event.target.value = "";
    if (file) ingestFile(file);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) ingestFile(file);
  }

  // ── Camera ───────────────────────────────────────────────────────────
  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser doesn't support camera capture. Upload a photo instead.");
      return;
    }
    try {
      // `ideal` rather than `exact` so laptops without a rear camera still get
      // their only camera instead of an OverconstrainedError. height is now
      // constrained too (previously only width was) — leaving it unconstrained
      // let some devices pick a lower-resolution preset that still satisfied
      // the width alone.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraLive(true);

      // Not every camera/browser exposes this constraint (it's part of the
      // separately-supported "image-capture" constraint set) — a device that
      // doesn't is left on its own default autofocus behaviour rather than
      // failing the whole capture over an advanced hint it can't honour.
      const [track] = stream.getVideoTracks();
      try {
        // focusMode isn't in TypeScript's MediaTrackConstraintSet (it's part
        // of the separately-specced image-capture constraints), hence the
        // cast — the browser is what actually validates this at runtime,
        // and rejects it into the catch below on anything that doesn't
        // support it.
        const advanced = [
          { focusMode: "continuous" },
        ] as unknown as MediaTrackConstraints["advanced"];
        await track?.applyConstraints({ advanced });
      } catch {
        // Unsupported constraint — ignored, see comment above.
      }

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });

      // Settle window before Capture is enabled — see the cameraReady
      // comment above for why. 700ms comfortably covers a phone's autofocus
      // hunt without the pause reading as the camera being unresponsive.
      focusTimerRef.current = setTimeout(() => setCameraReady(true), 700);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow access in your browser, or upload a photo instead."
          : name === "NotFoundError"
            ? "No camera found on this device. Upload a photo instead."
            : "Couldn't start the camera. Upload a photo instead.",
      );
    }
  }

  // Shared by both capture paths below: center-crops `source` to
  // CAPTURE_ASPECT — the same math CSS `object-cover` used to frame the
  // live preview inside the brackets — and returns a JPEG data URL of just
  // that region.
  function cropToDataUrl(source: CanvasImageSource, width: number, height: number): string {
    const sourceAspect = width / height;
    let sx = 0;
    let sy = 0;
    let sWidth = width;
    let sHeight = height;
    if (sourceAspect > CAPTURE_ASPECT) {
      // Wider than the card ratio — crop the sides.
      sWidth = height * CAPTURE_ASPECT;
      sx = (width - sWidth) / 2;
    } else {
      // Taller than the card ratio (the common phone-in-portrait case) —
      // crop top/bottom.
      sHeight = width / CAPTURE_ASPECT;
      sy = (height - sHeight) / 2;
    }

    const canvas = document.createElement("canvas");
    canvas.width = sWidth;
    canvas.height = sHeight;
    canvas.getContext("2d")?.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    // ImageCapture asks the camera hardware for an actual photo — full
    // sensor resolution, autofocus/exposure settled at the moment of
    // capture — rather than grabbing whatever frame the live preview
    // happened to be showing. The <video> element's feed is a compressed,
    // lower-resolution stream meant for on-screen display, not for OCR: a
    // frame drawn from it is the likely reason a multi-letter field like
    // the last name misreads more often from camera captures than from an
    // uploaded photo (which came from the phone's own camera app, already
    // taking a real photo). Not every browser implements ImageCapture
    // (notably older Safari), so this only ever upgrades the result when
    // available and falls back to the previous video-frame grab otherwise.
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && typeof ImageCapture !== "undefined") {
      try {
        const capture = new ImageCapture(track);
        const blob = await capture.takePhoto();
        const bitmap = await createImageBitmap(blob);
        const dataUrl = cropToDataUrl(bitmap, bitmap.width, bitmap.height);
        bitmap.close();
        setImage(dataUrl);
        stopCamera();
        setStage("preview");
        return;
      } catch {
        // Some devices advertise ImageCapture but reject takePhoto() (a
        // known gap on a handful of Android/Chrome combinations) — fall
        // through to the video-frame grab below rather than failing the
        // capture outright.
      }
    }

    setImage(cropToDataUrl(video, video.videoWidth, video.videoHeight));
    stopCamera();
    setStage("preview");
  }

  // ── Analysis ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "scanning" || !image) return;

    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      try {
        setStepIndex(0);
        // Raced against the minimum display time, so a slow decode extends
        // the stage rather than hiding behind it.
        const [result] = await Promise.all([analyseCapture(image), wait(STEP_MIN_MS)]);
        if (cancelled) return;

        setStepIndex(1);
        await wait(STEP_MIN_MS);
        if (cancelled) return;

        setStepIndex(2);
        await wait(STEP_MIN_MS * 0.7);
        if (cancelled) return;

        setStepIndex(3);
        // OCR only attempted for the doc types id-ocr.ts has real parsing
        // rules for (see isOcrSupported) — for anything else this is a
        // no-op wait, so the ticker still reads naturally rather than
        // skipping a step.
        if (isOcrSupported(docType)) {
          try {
            const [ocr] = await Promise.all([runOcr(image), wait(STEP_MIN_MS)]);
            if (cancelled) return;
            setRawOcr(ocr);

            const fields = parseIdFields(ocr, docType);
            if (fields.docNumber) {
              setDocNumber(fields.docNumber);
              setAutoFilled((a) => ({ ...a, docNumber: true }));
            }
            if (fields.lastName) {
              setLastName(fields.lastName);
              setAutoFilled((a) => ({ ...a, lastName: true }));
            }
          } catch {
            // OCR is a nice-to-have pre-fill, never a reason to fail the
            // whole capture — the operator can still type everything by
            // hand, exactly like before this existed.
            if (cancelled) return;
          }
        } else {
          await wait(STEP_MIN_MS * 0.5);
          if (cancelled) return;
        }

        setQuality(result);

        // Fade the scan overlay out rather than yanking it away mid-sweep —
        // see the `finishing` state's comment for why this is needed at all.
        setFinishing(true);
        await wait(260);
        if (cancelled) return;

        // Only celebrate a capture that actually passed. A bad photo goes
        // straight to the details step with its warnings visible.
        setStage(result.warnings.length ? "details" : "success");
        setFinishing(false);
      } catch {
        if (cancelled) return;
        setError("Couldn't read that image. Try another photo.");
        setStage("preview");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stage, image]);

  // Hold the celebration briefly, then move on.
  useEffect(() => {
    if (stage !== "success") return;
    const t = setTimeout(() => setStage("details"), SUCCESS_HOLD_MS);
    return () => clearTimeout(t);
  }, [stage]);

  const trimmedId = docNumber.trim();
  const idValid = meta.pattern.test(trimmedId);

  function applyAndClose() {
    setTouched(true);
    if (!idValid) return;
    onApply({ docType, docNumber: trimmedId, lastName: lastName.trim() });
    handleOpenChange(false);
  }

  const steps = [
    "Decoding capture…",
    "Measuring resolution and exposure…",
    "Checking focus…",
    "Reading text…",
  ];
  const showTabs = stage === "source";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* No `overflow-hidden` here: it would win over the primitive's
          overflow-y-auto and make a tall dialog unscrollable on a short
          viewport. overflow-x-hidden + the rounded corners already clip. */}
      <DialogContent className="max-w-3xl gap-0 rounded-md border-border p-0" hideClose>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <DialogHeader className="px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <ScanBadge />
            <div className="min-w-0 flex-1 text-left">
              <DialogTitle>Upload ID</DialogTitle>
              <DialogDescription className="text-pretty">
                {stage === "details"
                  ? "Confirm the document type and enter the details from the capture."
                  : "Capture or upload a photo of the customer's ID document."}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 shrink-0 self-start"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="h-px w-full bg-border" />

        {/* ── Source toggle ───────────────────────────────────────────── */}
        {showTabs && (
          <>
            <div className="px-4 py-4 sm:px-6">
              <Tabs
                value={tab}
                onValueChange={(v) => {
                  if (v === "upload") stopCamera();
                  setTab(v as SourceTab);
                  setError(null);
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="min-w-0 gap-2">
                    <Upload className="h-4 w-4 shrink-0" />
                    <span className="truncate">Upload a file</span>
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="min-w-0 gap-2">
                    <Camera className="h-4 w-4 shrink-0" />
                    <span className="truncate">Take a photo</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="h-px w-full bg-border" />
          </>
        )}

        {/* ── Body ────────────────────────────────────────────────────── */}
        {/* Fixed minimum on the source stage so switching tabs doesn't resize
            the dialog — the camera guide is naturally taller than the
            dropzone, and letting the modal jump between them is jarring. */}
        <div
          className={cn(
            "flex flex-col px-4 py-5 sm:px-6",
            stage === "source" ? "min-h-[320px] sm:min-h-[430px]" : "min-h-[280px] sm:min-h-[340px]",
          )}
        >
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source → upload. Once a file is in, this panel also does the job
              of the old separate preview stage — the file row sits at the top
              and the capture is confirmed directly underneath, rather than
              spending a whole extra step on one image and one question. */}
          {stage === "source" && tab === "upload" && (
            <div
              className={cn(
                "flex flex-1 flex-col space-y-4",
                // Centred while empty so the dropzone sits in the middle of the
                // panel; top-aligned once there's real content to read.
                !pendingFile && "justify-center",
              )}
            >
              {!pendingFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-14 text-center transition-colors",
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-primary/40",
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Drag the ID photo here</p>
                    <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 8MB</p>
                  </div>
                  <div className="flex w-full max-w-[220px] items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Browse file
                  </Button>
                </div>
              ) : (
                <>
                  <FileRow
                    file={pendingFile}
                    thumb={image}
                    onRemove={() => {
                      setPendingFile(null);
                      setImage(null);
                      setError(null);
                    }}
                  />
                  {image && pendingFile.status === "done" && (
                    <div className="space-y-2">
                      <div className="relative overflow-hidden rounded-md border border-border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element -- data: URI
                            from the local file, never a remote asset. */}
                        <img
                          src={image}
                          alt="Uploaded ID document"
                          className="aspect-[1.585] w-full object-contain"
                        />
                        <GuideFrame />
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        Is the whole document readable and in focus?
                      </p>
                    </div>
                  )}
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* Source → camera */}
          {stage === "source" && tab === "camera" && (
            <div className="flex flex-1 flex-col justify-center">
              {!cameraLive ? (
                <CameraGuide onStart={startCamera} />
              ) : (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-md bg-black">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="aspect-[1.585] w-full object-cover"
                    />
                    <GuideFrame />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    {cameraReady
                      ? "Fit the whole card inside the brackets, then capture."
                      : "Focusing…"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {stage === "preview" && image && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-md border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from
                    the local camera/file, never a remote asset; next/image can't optimise it. */}
                <img
                  src={image}
                  alt="Captured ID document"
                  className="aspect-[1.585] w-full object-contain"
                />
                <GuideFrame />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Is the whole document readable and in focus?
              </p>
            </div>
          )}

          {/* Scanning */}
          {stage === "scanning" && image && (
            <div className="space-y-4">
              <div
                className={cn(
                  "relative overflow-hidden rounded-md border border-primary/40 bg-muted transition-opacity duration-300 ease-out",
                  finishing && "opacity-0",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- see note above */}
                <img
                  src={image}
                  alt="Scanning ID document"
                  className="aspect-[1.585] w-full object-contain"
                />
                <div className="id-scan-grid pointer-events-none absolute inset-0" />

                {/* Diagonal shimmer + rising particles — purely atmospheric
                    "processing" flourish, layered behind the main scan line
                    rather than replacing it. Neither implies any specific
                    field was found; parseIdFields is the only thing that
                    actually claims that, via the "Auto-filled" badges later. */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="id-scan-shimmer absolute -inset-y-1/2 left-1/2 w-1/3 -translate-x-1/2 bg-gradient-to-b from-transparent via-white/40 to-transparent blur-sm" />
                  {[18, 38, 62, 82].map((x, i) => (
                    <span
                      key={x}
                      className="id-scan-particle absolute bottom-3 h-1 w-1 rounded-full bg-primary shadow-[0_0_6px_1px_var(--primary)]"
                      style={{ left: `${x}%`, "--x": `${(i % 2 === 0 ? -1 : 1) * 6}px`, "--delay": `${i * 0.4}s` } as React.CSSProperties}
                    />
                  ))}
                </div>

                {/* The animated element must span the *full* card height:
                    its keyframes translate it by percentages, and CSS
                    resolves a translateY percentage against the element's
                    own height, not its parent's. Sizing this to just the
                    visible beam's height (as an earlier version did) meant
                    the sweep only ever travelled within that small band
                    near the top — looking exactly like it "got partway down
                    and restarted", when it never had the room to go
                    further. The beam + its trailing glow are positioned at
                    the top *inside* this full-height container instead, so
                    they ride along as it translates the whole way down. */}
                <div className="id-scan-line pointer-events-none absolute inset-0">
                  <div className="absolute inset-x-0 top-0 h-px bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/25 to-transparent" />
                </div>
                <GuideFrame animated />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{steps[Math.min(stepIndex, steps.length - 1)]}</span>
              </div>

              <div className="flex justify-center gap-1.5">
                {steps.map((label, i) => (
                  <span
                    key={label}
                    className={cn(
                      "h-1 w-10 rounded-full transition-colors duration-300",
                      i <= stepIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Success celebration */}
          {stage === "success" && quality && (
            <div className="relative flex min-h-[300px] flex-col items-center justify-center text-center">
              <Confetti />
              <SuccessBadge />
              <h3 className="mt-5 text-lg font-semibold">Capture complete</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {quality.width} × {quality.height}px · clear and readable
              </p>
            </div>
          )}

          {/* Details. minmax(0,…) rather than a bare 1fr: `1fr` means
              minmax(auto,1fr), whose auto floor is the min-content of the
              column — which for the capture column is the photo's full
              intrinsic width. */}
          {stage === "details" && image && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <ZoomableCapture src={image} />
                <p className="text-center text-[11px] text-muted-foreground">
                  Click the image to zoom
                </p>
              </div>

              <div className="space-y-4">
                {quality?.warnings.length ? (
                  <div className="space-y-1 rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
                    {quality.warnings.map((w) => (
                      <p key={w} className="flex items-start gap-2 text-xs text-warning">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{w}</span>
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Document type</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CAPTURABLE_DOC_TYPES.map((t) => {
                      const m = docMeta[t];
                      const Icon = m.icon;
                      const active = docType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!m.supported}
                          onClick={() => {
                            setDocType(t);
                            setTouched(false);

                            // Re-parse the already-cached OCR text against
                            // the newly picked type — cheap (no re-running
                            // Tesseract) and correct, since National ID vs.
                            // Alien ID need different digit-count patterns.
                            // Only overwrites fields the operator hasn't
                            // hand-edited (still marked auto-filled, or
                            // still empty) — never clobbers their typing.
                            const fields = rawOcr ? parseIdFields(rawOcr, t) : null;
                            setDocNumber((n) => {
                              if (fields?.docNumber && (autoFilled.docNumber || n === "")) {
                                return fields.docNumber;
                              }
                              return m.normalize(n);
                            });
                            setAutoFilled((a) => ({
                              ...a,
                              docNumber: Boolean(fields?.docNumber) && (a.docNumber || docNumber === ""),
                            }));
                          }}
                          title={m.supported ? m.label : `${m.label} — not supported yet`}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition",
                            active
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                            !m.supported && "cursor-not-allowed opacity-40 hover:border-border",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{m.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px w-full bg-border" />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="scan-doc-number">{meta.shortLabel} number</Label>
                    {autoFilled.docNumber && <AutoFilledBadge />}
                  </div>
                  <Input
                    id="scan-doc-number"
                    autoComplete="off"
                    autoFocus
                    inputMode={docType === "national_id" || docType === "alien_id" ? "numeric" : "text"}
                    placeholder={meta.placeholder}
                    className="font-mono tracking-wider"
                    value={docNumber}
                    onChange={(e) => {
                      setDocNumber(meta.normalize(e.target.value));
                      setAutoFilled((a) => ({ ...a, docNumber: false }));
                    }}
                    onBlur={() => setTouched(true)}
                    onKeyDown={(e) => e.key === "Enter" && applyAndClose()}
                  />
                  <p className={cn("text-xs", touched && !idValid ? "text-destructive" : "text-muted-foreground")}>
                    {touched && !idValid ? meta.hint : meta.hint}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="scan-last-name">
                      Last name <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    {autoFilled.lastName && <AutoFilledBadge />}
                  </div>
                  <Input
                    id="scan-last-name"
                    autoComplete="off"
                    placeholder="e.g. Kamau"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setAutoFilled((a) => ({ ...a, lastName: false }));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && applyAndClose()}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {autoFilled.docNumber || autoFilled.lastName
                    ? "Pre-filled from the capture — check it against the photo before confirming."
                    : "Type what you can see on the capture."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {stage !== "success" && (
          <>
            <div className="h-px w-full bg-border" />
            <div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
              {stage === "source" ? (
                <>
                  <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  {tab === "upload" ? (
                    // Straight to the analysis — the confirm step now lives in
                    // the panel above, so there's nothing in between.
                    <Button
                      disabled={!image || pendingFile?.status !== "done"}
                      onClick={() => setStage("scanning")}
                      className="gap-2"
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan document
                    </Button>
                  ) : cameraLive ? (
                    <Button
                      disabled={!cameraReady}
                      onClick={() => void capturePhoto()}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {cameraReady ? "Capture" : "Focusing…"}
                    </Button>
                  ) : null}
                </>
              ) : stage === "preview" ? (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setImage(null);
                      setPendingFile(null);
                      setStage("source");
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </Button>
                  <Button onClick={() => setStage("scanning")} className="gap-2">
                    <ScanLine className="h-4 w-4" />
                    Scan document
                  </Button>
                </>
              ) : stage === "scanning" ? (
                <p className="w-full text-center text-xs text-muted-foreground">
                  Analysing the capture…
                </p>
              ) : (
                <>
                  <Button variant="outline" className="gap-2" onClick={resetAll}>
                    <RotateCcw className="h-4 w-4" />
                    Scan again
                  </Button>
                  <Button onClick={applyAndClose} disabled={!idValid} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Use these details
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────── */

/**
 * Animated stand-in for the static <ScanLine /> that used to sit here: corner
 * brackets breathing while a line sweeps between them, on a 2.4s loop.
 *
 * Hand-drawn SVG rather than a Lottie file — a 40px header icon doesn't
 * justify a ~250KB player dependency, and this way it inherits `currentColor`,
 * so it tracks the brand green in both themes and needs no licensing.
 */
function ScanBadge() {
  return (
    <span className="hidden h-14 w-14 shrink-0 items-center justify-center text-primary sm:flex">
      <svg
        viewBox="0 0 24 24"
        className="h-11 w-11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Framing brackets — heaviest stroke, so they hold the silhouette at
            20px where the face detail alone would turn to mush. */}
        <g className="id-badge-corners" strokeWidth="2">
          <path d="M4 8V6a2 2 0 0 1 2-2h2" />
          <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
          <path d="M4 16v2a2 2 0 0 0 2 2h2" />
          <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
        </g>

        {/* Face. Deliberately lighter than the brackets: at this size a single
            uniform stroke weight reads as a blob, so the frame carries the
            shape and the features sit a step back from it. */}
        <g strokeWidth="1.4">
          <ellipse cx="12" cy="12" rx="3.5" ry="4.3" />
          <path d="M11.9 11.6v1.3" />
          <path d="M10.5 14.6c.9.7 2.1.7 3 0" />
        </g>
        {/* Eyes as filled dots — two 1.4-wide strokes would merge with the
            head outline at 20px, a dot stays distinct. */}
        <g fill="currentColor" stroke="none">
          <circle cx="10.5" cy="10.8" r="0.7" />
          <circle cx="13.5" cy="10.8" r="0.7" />
        </g>

        {/* The sweeping read-head, passing over the face. */}
        <line x1="6.5" y1="12" x2="17.5" y2="12" strokeWidth="1.6" className="id-badge-sweep" />
      </svg>
    </span>
  );
}

function FileRow({
  file,
  thumb,
  onRemove,
}: {
  file: PendingFile;
  thumb: string | null;
  onRemove: () => void;
}) {
  const pct = Math.round(file.progress * 100);
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data: URI
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-4 w-4 text-muted-foreground" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {/* min-w-0 as well as truncate: a 40-character WhatsApp filename
              would otherwise set this row's min-content width and push the
              whole dialog wider than a phone screen. */}
          <span className="min-w-0 truncate text-sm font-medium">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
        </div>

        {file.status === "done" ? (
          <span className="mt-1 flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" />
            Ready to scan
          </span>
        ) : file.status === "error" ? (
          <span className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Couldn&apos;t read this file
          </span>
        ) : (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground">{pct}%</span>
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon" className="shrink-0" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  );
}

function CameraGuide({ onStart }: { onStart: () => void }) {
  const tips = [
    { icon: Sun, text: "Use a well-lit space and avoid glare on the card." },
    { icon: ScanLine, text: "Fit the whole card inside the frame — no cropped edges." },
    { icon: Lightbulb, text: "Rest it on a flat, dark surface for the sharpest result." },
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
      {/* Centred when the grid collapses to one column on mobile, flush left
          beside the copy on wider screens. */}
      <div className="flex justify-center sm:block">
        <PhoneMockup />
      </div>
      <div className="space-y-4 text-center sm:text-left">
        <div>
          <h3 className="text-base font-semibold">Photograph the ID in a well-lit space</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Make sure every detail on the card is legible before you capture.
          </p>
        </div>
        <ul className="space-y-2.5">
          {tips.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-2.5 text-left text-sm text-muted-foreground"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-3 w-3" />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onStart} className="w-full gap-2 sm:w-auto">
          <Camera className="h-4 w-4" />
          Open camera
        </Button>
      </div>
    </div>
  );
}

/**
 * Drop a sample ID card image here and the mockup picks it up automatically.
 * If the file is absent the <image> renders nothing and the drawn card
 * underneath shows through instead — so this never appears broken.
 *
 * Use a generated/specimen card only. Never a real person's document.
 */
const SAMPLE_ID_SRC = "/images/sample-id.png";

/**
 * Fixed colours for the device mockup — deliberately NOT theme tokens.
 *
 * The first pass used `fill-foreground` / `fill-background` for the phone
 * chassis and screen, which inverted in dark mode: the "dark surface" the tips
 * tell you to photograph on came out bright white. A phone is a physical
 * object in an illustration, not a themed surface — a real handset doesn't turn
 * white when the OS switches theme, and neither should this. The card face
 * stays light for the same reason: ID cards are printed on white stock.
 *
 * Only the alignment brackets and the card's accent band use theme tokens,
 * since those are UI drawn *by* the app rather than parts of the object.
 */
const DEVICE = {
  railLight: "#b6bdc9",
  railDark: "#6f7787",
  bezel: "#0a0e15",
  screen: "#171e2b",
  card: "#eef1f6",
  cardEdge: "#c9cfdb",
  cardInk: "#1f2937",
  island: "#05080d",
} as const;

/** iPhone-style device mockup framing an ID card in the camera viewfinder. */
function PhoneMockup() {
  // useId() emits delimiters (React 19: «r0») that aren't valid in an XML id
  // or inside url(#…), so strip everything but word characters.
  const clipId = "idcap" + useId().replace(/[^a-zA-Z0-9]/g, "");

  // Card geometry, kept in one place so the brackets can be derived from it
  // rather than hand-positioned twice.
  const card = { x: 26, y: 148, w: 148, h: 93 };
  const pad = 7;
  const arm = 15;
  const l = card.x - pad;
  const r = card.x + card.w + pad;
  const t = card.y - pad;
  const b = card.y + card.h + pad;

  return (
    <svg
      viewBox="0 0 200 400"
      className="h-[240px] w-auto shrink-0 sm:h-[310px]"
      role="img"
      aria-label="Phone camera framing an ID card inside alignment brackets"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={card.x} y={card.y} width={card.w} height={card.h} rx="6" />
        </clipPath>
        <linearGradient id={`${clipId}-rail`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={DEVICE.railLight} />
          <stop offset="45%" stopColor={DEVICE.railDark} />
          <stop offset="100%" stopColor={DEVICE.railLight} />
        </linearGradient>
        {/* Diagonal screen glare — subtle enough to read as glass, not as a shape. */}
        <linearGradient id={`${clipId}-glare`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.10" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Side buttons, drawn behind the body so they read as sitting under the rail */}
      <g fill={DEVICE.railDark}>
        <rect x="4" y="104" width="4" height="20" rx="2" />
        <rect x="4" y="136" width="4" height="34" rx="2" />
        <rect x="4" y="180" width="4" height="34" rx="2" />
        <rect x="192" y="150" width="4" height="50" rx="2" />
      </g>

      {/* Titanium rail */}
      <rect x="8" y="4" width="184" height="392" rx="34" fill={`url(#${clipId}-rail)`} />
      {/* Bezel */}
      <rect x="12" y="8" width="176" height="384" rx="30" fill={DEVICE.bezel} />
      {/* Viewfinder — a photo of a dark surface, as the tips advise */}
      <rect x="17" y="13" width="166" height="374" rx="26" fill={DEVICE.screen} />

      {/* The ID card: drawn fallback first, real image layered over it */}
      <g>
        <rect
          x={card.x} y={card.y} width={card.w} height={card.h} rx="6"
          fill={DEVICE.card} stroke={DEVICE.cardEdge} strokeWidth="1"
        />
        <rect x={card.x} y={card.y} width={card.w} height="15" rx="6" className="fill-primary/30" />
        <rect x={card.x} y={card.y + 9} width={card.w} height="6" className="fill-primary/30" />
        <rect x={card.x + 8} y={card.y + 24} width="32" height="40" rx="3" fill={DEVICE.cardInk} opacity="0.25" />
        <rect x={card.x + 47} y={card.y + 26} width="62" height="6" rx="3" fill={DEVICE.cardInk} opacity="0.3" />
        <rect x={card.x + 47} y={card.y + 38} width="48" height="5" rx="2.5" fill={DEVICE.cardInk} opacity="0.18" />
        <rect x={card.x + 47} y={card.y + 49} width="56" height="5" rx="2.5" fill={DEVICE.cardInk} opacity="0.18" />
        <rect x={card.x + 8} y={card.y + 72} width="120" height="6" rx="3" fill={DEVICE.cardInk} opacity="0.18" />

        <image
          href={SAMPLE_ID_SRC}
          x={card.x}
          y={card.y}
          width={card.w}
          height={card.h}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </g>

      {/* Alignment brackets, derived from the card box above */}
      <g className="stroke-primary" strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d={`M${l} ${t + arm} V${t} H${l + arm}`} />
        <path d={`M${r - arm} ${t} H${r} V${t + arm}`} />
        <path d={`M${l} ${b - arm} V${b} H${l + arm}`} />
        <path d={`M${r - arm} ${b} H${r} V${b - arm}`} />
      </g>

      {/* Caption strip, mirroring the live camera hint */}
      <rect x="38" y="292" width="124" height="5" rx="2.5" fill="#fff" opacity="0.35" />
      <rect x="56" y="304" width="88" height="5" rx="2.5" fill="#fff" opacity="0.2" />

      {/* Shutter */}
      <circle cx="100" cy="342" r="15" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5" />
      <circle cx="100" cy="342" r="11" fill="#fff" opacity="0.85" />

      {/* Dynamic Island */}
      <rect x="76" y="24" width="48" height="14" rx="7" fill={DEVICE.island} />

      {/* Home indicator */}
      <rect x="72" y="374" width="56" height="4" rx="2" fill="#fff" opacity="0.5" />

      {/* Glass glare over everything */}
      <rect
        x="17" y="13" width="166" height="374" rx="26"
        fill={`url(#${clipId}-glare)`}
        pointerEvents="none"
      />
    </svg>
  );
}

function SuccessBadge() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <span className="id-success-ring absolute inset-0 rounded-full bg-success/30" />
      <span className="id-success-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
          <path
            d="M11 20.5 L17.5 27 L29 15"
            className="id-success-draw stroke-success"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
    </div>
  );
}

/**
 * Confetti burst. Positions are randomised once per mount via useMemo so a
 * re-render doesn't reshuffle mid-flight.
 */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 44 + Math.random() * 0.4;
        const distance = 90 + Math.random() * 130;
        return {
          id: i,
          dx: `${Math.cos(angle) * distance}px`,
          // Biased downward so it falls rather than hanging in the air.
          dy: `${Math.sin(angle) * distance + 60 + Math.random() * 50}px`,
          rot: `${Math.random() * 720 - 360}deg`,
          delay: `${Math.random() * 0.18}s`,
          size: 5 + Math.random() * 5,
          round: Math.random() > 0.6,
          tone: ["bg-primary", "bg-success", "bg-warning", "bg-info"][i % 4],
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={cn("id-confetti-piece absolute", p.tone, p.round ? "rounded-full" : "rounded-[1px]")}
          style={
            {
              width: p.size,
              height: p.size * (p.round ? 1 : 1.6),
              "--dx": p.dx,
              "--dy": p.dy,
              "--rot": p.rot,
              "--delay": p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Click to toggle a 2.5× zoom. While zoomed the transform origin tracks the
 * pointer, so the whole card is reachable without a full pan implementation —
 * all that's needed to read a number off a photo.
 */
function ZoomableCapture({ src }: { src: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-black",
        zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
      )}
      onClick={() => setZoomed((z) => !z)}
      onMouseMove={(e) => {
        if (!zoomed) return;
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(
          `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
        );
      }}
      onMouseLeave={() => setOrigin("50% 50%")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local data: URI */}
      <img
        src={src}
        alt="Captured ID document"
        // object-contain, not cover: cropping would hide the very digits the
        // operator is here to read.
        className="aspect-[1.585] w-full object-contain transition-transform duration-200"
        style={{ transform: zoomed ? "scale(2.5)" : "scale(1)", transformOrigin: origin }}
      />
      {!zoomed && (
        <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[11px] text-white">
          <ZoomIn className="h-3 w-3" />
          Zoom
        </span>
      )}
    </div>
  );
}

/** Flags a field OCR filled in, so it reads as "check this" rather than
 * silently indistinguishable from something the operator typed themselves. */
function AutoFilledBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
      <Sparkles className="h-2.5 w-2.5" />
      Auto-filled
    </span>
  );
}

/** Corner brackets framing the document area. */
function GuideFrame({ animated }: { animated?: boolean }) {
  const corners = [
    "left-3 top-3 border-l-2 border-t-2 rounded-tl",
    "right-3 top-3 border-r-2 border-t-2 rounded-tr",
    "left-3 bottom-3 border-b-2 border-l-2 rounded-bl",
    "right-3 bottom-3 border-b-2 border-r-2 rounded-br",
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {corners.map((pos) => (
        <span
          key={pos}
          className={cn("absolute h-7 w-7 border-primary", pos, animated && "id-scan-bracket")}
        />
      ))}
    </div>
  );
}
