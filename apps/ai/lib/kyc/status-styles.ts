// Shared badge vocabulary for the verifications list/detail pages — ported
// from apps/kyc's kyc-verifications.ts (the parts of that file that weren't
// its mock demo dataset).
export type VerificationStatus = "Approved" | "Pending" | "Processing" | "Rejected" | "Flagged";

export const statusStyles: Record<VerificationStatus, string> = {
  Approved: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning-foreground border-warning/30",
  Processing: "bg-info/10 text-info border-info/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  Flagged: "bg-destructive/15 text-destructive border-destructive/30",
};
