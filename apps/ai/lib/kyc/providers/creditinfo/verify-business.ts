import "server-only";

import type { BusinessVerificationInput, BusinessVerificationResult } from "../provider.interface";
import { runStrategy } from "./client";
import { mapBusinessResponse } from "./mapper";
import { getCreditinfoCredentials, maskSecret, type CreditinfoEnvironment } from "./config";
import type { CreditinfoBusinessEndQueryResponse } from "./types";

export async function verifyBusiness(
  input: BusinessVerificationInput,
  environment: CreditinfoEnvironment
): Promise<BusinessVerificationResult> {
  if (!input.registrationNumber || !input.registrationNumber.trim()) {
    throw new Error("registrationNumber is required for business verification.");
  }

  const { brsUboStrategyId } = getCreditinfoCredentials(environment);
  console.log("[creditinfo] verifyBusiness", {
    environment,
    strategyId: brsUboStrategyId,
    registrationNumber: maskSecret(input.registrationNumber),
  });

  const res = await runStrategy<CreditinfoBusinessEndQueryResponse>(environment, brsUboStrategyId, {
    RegistrationNumber: input.registrationNumber,
  });

  return mapBusinessResponse(res);
}
