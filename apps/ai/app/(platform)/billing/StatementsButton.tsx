"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/file-export";
import type { WalletTransaction } from "@/lib/kyc/client-api";

function txLabel(t: WalletTransaction): string {
  if (t.type === "topup") return t.note || "Wallet top-up";
  if (t.type === "debit") return t.note || "Verification charge";
  return t.note || "Manual adjustment";
}

export function StatementsButton({ transactions }: { transactions: WalletTransaction[] }) {
  function handleClick() {
    const rows = transactions.map((t) => [
      t.id,
      txLabel(t),
      t.type,
      new Date(t.created_at).toISOString(),
      t.type === "debit" ? -Number(t.amount) : Number(t.amount),
      t.balance_after,
    ]);
    downloadCsv(
      `xobriq-billing-statement-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Reference", "Description", "Type", "Date", "Amount (KES)", "Balance after (KES)"],
      rows,
    );
  }

  return (
    <Button variant="outline" className="hidden gap-2 sm:inline-flex" onClick={handleClick}>
      <Download className="h-4 w-4" /> Statements
    </Button>
  );
}
