// Normalized shapes every KYC provider adapter must return, regardless of
// how the underlying provider (Creditinfo today, potentially others later)
// structures its own response. Nothing outside `lib/kyc/providers/**` should
// ever see a provider-native shape.

export type IdentityVerificationInput = {
  identifierType: "national_id" | "krapinalien_id" | "krapin" | "bank" | "plate" | "dl";
  identifierNumber: string;
};

export type IdentityVerificationResult = {
  matched: boolean;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;
  idNumber: string;
  // Ordered label/value pairs for whatever fields this identifier type
  // actually returned (bank/KRA PIN/driving licence/vehicle plate each
  // return a different set of fields than national_id/alien_id do) — lets
  // the UI render the right details for any identifierType without needing
  // a bespoke result shape per type.
  fields: { label: string; value: string }[];
  raw: unknown;
};

export type PhoneVerificationInput = {
  nationalId: string;
  mobileNumber: string;
};

export type PhoneVerificationResult = {
  matched: boolean;
  mobileNumber: string;
  raw: unknown;
};

export type BusinessVerificationInput = {
  registrationNumber: string;
};

export type BeneficialOwner = {
  name: string;
  role: string;
  idType: string | null;
  idNumber: string | null;
  ownershipPercentage: number | null;
};

export type BusinessVerificationResult = {
  matched: boolean;
  status: string | null;
  businessName: string | null;
  registrationDate: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  beneficialOwners: BeneficialOwner[];
  raw: unknown;
};

export type ProviderHealth = {
  healthy: boolean;
  detail?: string;
};

// Which credential/endpoint set a call should use — provider-agnostic
// (adapters map this onto their own environment-specific config; see
// lib/kyc/providers/creditinfo/config.ts for Creditinfo's).
export type ProviderEnvironment = "sandbox" | "production";

export interface KycProviderAdapter {
  key: string;
  verifyIdentity(input: IdentityVerificationInput, environment: ProviderEnvironment): Promise<IdentityVerificationResult>;
  verifyPhone(input: PhoneVerificationInput, environment: ProviderEnvironment): Promise<PhoneVerificationResult>;
  verifyBusiness(input: BusinessVerificationInput, environment: ProviderEnvironment): Promise<BusinessVerificationResult>;
  healthCheck(environment?: ProviderEnvironment): Promise<ProviderHealth>;
}
