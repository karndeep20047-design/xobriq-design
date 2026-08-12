"use server";

import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreGuardTransaction, type GuardTransactionIn } from "@/lib/ai-client";

const TXN_TYPES: GuardTransactionIn["type"][] = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"];

function randomTestTransaction(): GuardTransactionIn {
  const amount = Math.round(Math.random() * 200000 * 100) / 100;
  const oldbalanceOrg = Math.round((amount + Math.random() * 50000) * 100) / 100;
  const newbalanceOrig = Math.max(0, Math.round((oldbalanceOrg - amount) * 100) / 100);
  const oldbalanceDest = Math.round(Math.random() * 20000 * 100) / 100;
  const newbalanceDest = Math.round((oldbalanceDest + amount) * 100) / 100;

  return {
    step: Math.floor(Math.random() * 744),
    type: TXN_TYPES[Math.floor(Math.random() * TXN_TYPES.length)],
    amount,
    oldbalanceOrg,
    newbalanceOrig,
    oldbalanceDest,
    newbalanceDest,
  };
}

export async function sendTestGuardTransaction() {
  await requireStaffPermission("guard");
  await scoreGuardTransaction(randomTestTransaction());
}

export async function resetGuardHits() {
  await requireStaffPermission("guard");
  const admin = createAdminClient();
  await admin.from("guard_decisions").delete().not("id", "is", null);
}
