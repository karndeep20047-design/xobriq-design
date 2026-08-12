import "server-only";

import type { IdentityVerificationInput, IdentityVerificationResult } from "../provider.interface";
import { runStrategy } from "./client";
import { mapIdentityResponse } from "./mapper";
import { getCreditinfoCredentials, maskSecret, type CreditinfoEnvironment } from "./config";
import type { CreditinfoIdentityEndQueryResponse } from "./types";

export async function verifyIdentity(
  input: IdentityVerificationInput,
  environment: CreditinfoEnvironment
): Promise<IdentityVerificationResult> {
  // The value submitted must actually reach Creditinfo — an empty/blank
  // identifierNumber would otherwise BeginQuery with nothing to look up and
  // come back either as an ambiguous non-match or, worse, a provider-side
  // default record, silently instead of a clear client-side error.
  if (!input.identifierNumber || !input.identifierNumber.trim()) {
    throw new Error("identifierNumber is required for identity verification.");
  }

  const { kycStrategyId } = getCreditinfoCredentials(environment);
  console.log("[creditinfo] verifyIdentity", {
    environment,
    strategyId: kycStrategyId,
    identifierType: input.identifierType,
    identifierNumber: maskSecret(input.identifierNumber),
  });

  const res = await runStrategy<CreditinfoIdentityEndQueryResponse>(environment, kycStrategyId, {
    IdentifierType: input.identifierType,
    IdentifierNumber: input.identifierNumber,
  });

  return mapIdentityResponse(res, input.identifierType);
}
