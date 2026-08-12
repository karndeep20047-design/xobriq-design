import "server-only";

import type { PhoneVerificationInput, PhoneVerificationResult } from "../provider.interface";
import { runStrategy } from "./client";
import { mapPhoneResponse } from "./mapper";
import { getCreditinfoCredentials, maskSecret, type CreditinfoEnvironment } from "./config";
import type { CreditinfoPhoneEndQueryResponse } from "./types";

export async function verifyPhone(
  input: PhoneVerificationInput,
  environment: CreditinfoEnvironment
): Promise<PhoneVerificationResult> {
  if (!input.mobileNumber || !input.mobileNumber.trim()) {
    throw new Error("mobileNumber is required for phone verification.");
  }
  if (!input.nationalId || !input.nationalId.trim()) {
    throw new Error("nationalId is required for phone verification.");
  }

  const { phoneStrategyId } = getCreditinfoCredentials(environment);
  console.log("[creditinfo] verifyPhone", {
    environment,
    strategyId: phoneStrategyId,
    mobileNumber: maskSecret(input.mobileNumber),
    nationalId: maskSecret(input.nationalId),
  });

  const res = await runStrategy<CreditinfoPhoneEndQueryResponse>(environment, phoneStrategyId, {
    NationalId: input.nationalId,
    InputMobileNumber: input.mobileNumber,
  });

  return mapPhoneResponse(res);
}
