import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type GuardTransactionIn = {
  step: number;
  type: "CASH_IN" | "CASH_OUT" | "DEBIT" | "PAYMENT" | "TRANSFER";
  amount: number;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
};

export type GuardDecision = {
  action: "BLOCK" | "REVIEW" | "ALLOW";
  model_score: number | null;
  rule_action: "BLOCK" | "REVIEW" | "ALLOW";
  reasons: Record<string, any>[];
  versions: Record<string, any>;
  shadow: Record<string, any> | null;
};

async function assessTransaction(txn: GuardTransactionIn): Promise<GuardDecision> {
  const res = await fetch(`${process.env.XOBRIQ_GUARD_API_URL}/assess`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.XOBRIQ_GUARD_API_KEY
        ? { Authorization: `Bearer ${process.env.XOBRIQ_GUARD_API_KEY}` }
        : {}),
    },
    body: JSON.stringify(txn),
  });

  if (!res.ok) {
    throw new Error(`Guard /assess failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function recordGuardHit(txn: GuardTransactionIn, decision: GuardDecision, orgId?: string) {
  const admin = createAdminClient();
  await admin.from("guard_decisions").insert({
    org_id: orgId ?? null,
    step: txn.step,
    type: txn.type,
    amount: txn.amount,
    oldbalance_org: txn.oldbalanceOrg,
    newbalance_orig: txn.newbalanceOrig,
    oldbalance_dest: txn.oldbalanceDest,
    newbalance_dest: txn.newbalanceDest,
    action: decision.action,
    rule_action: decision.rule_action,
    model_score: decision.model_score,
    reasons: decision.reasons,
    versions: decision.versions,
    shadow: decision.shadow,
  });
}

export async function scoreGuardTransaction(
  txn: GuardTransactionIn,
  orgId?: string
): Promise<GuardDecision> {
  const decision = await assessTransaction(txn);
  await recordGuardHit(txn, decision, orgId);
  return decision;
}
