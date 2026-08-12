import { jsPDF } from "jspdf";
import type {
  BusinessResult,
  IdentityResult,
  PhoneResult,
  VerificationOutcome,
} from "@/lib/kyc/client-api";

const MARGIN = 14;

type VerificationKind = "identity" | "phone" | "business";

function identityFields(result: IdentityResult): { label: string; value: string }[] {
  if (result.fields && result.fields.length > 0) return result.fields;
  return [
    { label: "First name", value: result.firstName || "—" },
    { label: "Last name", value: result.lastName || "—" },
    { label: "Gender", value: result.gender || "—" },
    { label: "Date of birth", value: result.dateOfBirth || "—" },
    { label: "Citizenship", value: result.citizenship || "—" },
    { label: "ID number", value: result.idNumber || "—" },
  ];
}

export function downloadVerificationReportPdf(
  kind: VerificationKind,
  record: VerificationOutcome<IdentityResult | PhoneResult | BusinessResult>,
) {
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

  const failed = record.status === "failed";
  const matched = !!record.matched;

  heading("Xobriq KYC — Verification Report");
  line(`Reference: ${record.ref}`);
  line(`Type: ${kind.charAt(0).toUpperCase() + kind.slice(1)} verification`);
  line(`Status: ${failed ? "Failed" : matched ? "Matched" : "Not matched"}`);
  line(`Completed: ${record.completedAt ? new Date(record.completedAt).toLocaleString() : "—"}`);
  line(`Latency: ${record.durationMs ? `${(record.durationMs / 1000).toFixed(1)}s` : "—"}`);
  line("Source: IPRS · Sandbox");
  y += 3;

  if (failed || !record.result) {
    ensureSpace(15);
    subheading("Error");
    line(record.errorMessage || "Verification did not complete.");
    doc.save(`xobriq-kyc-${record.ref}.pdf`);
    return;
  }

  ensureSpace(20);
  if (kind === "identity") {
    subheading("Applicant details");
    for (const f of identityFields(record.result as IdentityResult)) {
      ensureSpace(6);
      line(`${f.label}: ${f.value}`);
    }
  } else if (kind === "phone") {
    const result = record.result as PhoneResult;
    subheading("Phone details");
    line(`Mobile number: ${result.mobileNumber || "—"}`);
  } else {
    const result = record.result as BusinessResult;
    subheading("Business details");
    line(`Business name: ${result.businessName || "—"}`);
    line(`Status: ${result.status || "—"}`);
    line(`Registration date: ${result.registrationDate || "—"}`);
    line(`Physical address: ${result.physicalAddress || "—"}`);
    line(`Postal address: ${result.postalAddress || "—"}`);

    if (result.beneficialOwners.length > 0) {
      y += 3;
      ensureSpace(15);
      subheading("Beneficial owners");
      for (const owner of result.beneficialOwners) {
        ensureSpace(6);
        line(
          `${owner.name || "—"} · ${owner.role || "—"} · ${owner.idNumber || "—"}` +
            (owner.ownershipPercentage ? ` · ${owner.ownershipPercentage}%` : ""),
        );
      }
    }
  }

  y += 3;
  ensureSpace(15);
  subheading("Verification checks");
  line(matched ? "IPRS record found — matched to a live IPRS record (Pass)" : "IPRS returned no match");

  doc.save(`xobriq-kyc-${record.ref}.pdf`);
}
