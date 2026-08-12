import { jsPDF } from "jspdf";
import type { ScanReport } from "@/app/(console)/console/guard/ScanPanel";

const MARGIN = 14;

export function downloadScanReportPdf(report: ScanReport) {
  const doc = new jsPDF();
  let y = MARGIN;

  const heading = (text: string) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(text, MARGIN, y);
    y += 8;
  };
  const subheading = (text: string) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(text, MARGIN, y);
    y += 6;
  };
  const line = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(text, MARGIN, y);
    y += 5.5;
  };
  const ensureSpace = (needed: number) => {
    if (y + needed > 285) {
      doc.addPage();
      y = MARGIN;
    }
  };

  heading("Xobriq Guard — Batch Fraud Scan Report");
  line(`Generated: ${new Date().toISOString()}`);
  line(`Rule engine: v${report.versions.rules ?? "—"} · Model: v${report.versions.model ?? "—"} · Policy: v${report.versions.policy ?? "—"}`);
  y += 3;

  subheading("Summary");
  line(`Total records scanned: ${report.total_records.toLocaleString()}`);
  line(`Blocked: ${report.counts.BLOCK.toLocaleString()}  ·  Review: ${report.counts.REVIEW.toLocaleString()}  ·  Allowed: ${report.counts.ALLOW.toLocaleString()}`);
  y += 3;

  ensureSpace(20);
  subheading("Breakdown by transaction type");
  for (const row of report.by_type) {
    line(`${row.type}: ${row.count.toLocaleString()} total — ${row.BLOCK.toLocaleString()} blocked, ${row.REVIEW.toLocaleString()} review, ${row.ALLOW.toLocaleString()} allowed`);
  }
  y += 3;

  if (report.ground_truth) {
    ensureSpace(30);
    subheading("Model performance vs. ground truth (isFraud labels)");
    const gt = report.ground_truth;
    line(`Precision: ${(gt.precision * 100).toFixed(2)}%  ·  Recall: ${(gt.recall * 100).toFixed(2)}%  ·  F1: ${(gt.f1 * 100).toFixed(2)}%`);
    line(`True positives: ${gt.tp.toLocaleString()}  ·  False positives: ${gt.fp.toLocaleString()}  ·  False negatives: ${gt.fn.toLocaleString()}`);
    y += 3;
  }

  if (report.sample_flagged.length > 0) {
    ensureSpace(20);
    subheading("Top flagged transactions");
    for (const row of report.sample_flagged) {
      ensureSpace(6);
      const score = row.model_score === null ? "—" : row.model_score.toFixed(4);
      line(`step ${row.step} · ${row.type} · ${row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} · ${row.action} (rule: ${row.rule_action}, model: ${score})`);
    }
  }

  doc.save("guard-scan-report.pdf");
}
