import type {
  BeneficialOwner,
  BusinessVerificationResult,
  IdentityVerificationInput,
  IdentityVerificationResult,
  PhoneVerificationResult,
} from "../provider.interface";
import type {
  CreditinfoBankAccountData,
  CreditinfoBusinessData,
  CreditinfoBusinessEndQueryResponse,
  CreditinfoDrivingLicenseData,
  CreditinfoIdentityEndQueryResponse,
  CreditinfoKraPinData,
  CreditinfoNationalIdData,
  CreditinfoPhoneEndQueryResponse,
  CreditinfoVehicleData,
} from "./types";
import { CreditinfoResponseFormatError } from "./errors";

// Every EndQuery response — identity, phone, business alike — is assumed by
// its type to have `Data.response` present. That's a compile-time assumption
// only; nothing validated it against what Creditinfo actually sends over the
// wire, so a real response missing it (a different strategy template, an
// error shape, a Production tenant configured differently to Sandbox) used
// to crash with a bare "Cannot read properties of undefined" instead of a
// diagnosable error. This is the one place that assumption gets checked
// before any mapper trusts the shape below Data.response — callers still
// need their own optional chaining for the *inner* nodes (IdmIdentifyAfrica,
// GeneralInformation, etc.), which are legitimately absent for some
// responses (e.g. a genuine no-match), not just malformed ones.
function requireResponseEnvelope(res: unknown, context: string): Record<string, unknown> {
  if (!res || typeof res !== "object") {
    console.error(`[creditinfo] ${context}: malformed response — body is not an object`, {
      bodyType: typeof res,
    });
    throw new CreditinfoResponseFormatError(
      `Creditinfo returned an unexpected ${context} response structure.`
    );
  }
  const data = (res as { Data?: unknown }).Data;
  if (!data || typeof data !== "object") {
    console.error(`[creditinfo] ${context}: malformed response — missing Data`, {
      topLevelKeys: Object.keys(res as object),
    });
    throw new CreditinfoResponseFormatError(
      `Creditinfo returned an unexpected ${context} response structure (missing Data).`
    );
  }
  const response = (data as { response?: unknown }).response;
  if (!response || typeof response !== "object") {
    // Data.invalidRequest is Creditinfo's own complaint about the shape of
    // OUR request (a rejected strategy input, not anything about the person
    // being looked up) — safe to log in full, unlike everything else here.
    const invalidRequest = (data as { invalidRequest?: unknown }).invalidRequest;
    console.error(`[creditinfo] ${context}: malformed response — missing Data.response`, {
      dataKeys: Object.keys(data as object),
      invalidRequest: invalidRequest ?? undefined,
    });
    throw new CreditinfoResponseFormatError(
      `Creditinfo returned an unexpected ${context} response structure (missing Data.response).`
    );
  }
  return response as Record<string, unknown>;
}

const EMPTY: IdentityVerificationResult = {
  matched: false,
  fullName: null,
  firstName: null,
  lastName: null,
  gender: null,
  dateOfBirth: null,
  citizenship: null,
  idNumber: "",
  fields: [],
  raw: null,
};

export function mapIdentityResponse(
  res: CreditinfoIdentityEndQueryResponse,
  identifierType: IdentityVerificationInput["identifierType"]
): IdentityVerificationResult {
  const response = requireResponseEnvelope(res, "identity");
  const identifyAfrica = response.IdmIdentifyAfrica as
    | { data?: { response?: Record<string, unknown> } }
    | undefined;
  const wrapper = identifyAfrica?.data?.response;
  if (!wrapper) return { ...EMPTY, raw: res };

  const success = wrapper.success === "true";

  if (identifierType === "national_id" || identifierType === "krapinalien_id") {
    const data = wrapper.data as CreditinfoNationalIdData;
    const matched = !!data && data.valid === "true";
    return {
      matched,
      fullName: data?.name ?? null,
      firstName: data?.first_name ?? null,
      lastName: data?.last_name ?? null,
      gender: data?.gender ?? null,
      dateOfBirth: data?.dob ?? null,
      citizenship: data?.citizenship ?? null,
      idNumber: data?.id_number ?? "",
      fields: data
        ? [
            { label: "Full name", value: data.name ?? "—" },
            { label: "First name", value: data.first_name ?? "—" },
            { label: "Last name", value: data.last_name ?? "—" },
            { label: "Gender", value: data.gender ?? "—" },
            { label: "Date of birth", value: data.dob ?? "—" },
            { label: "Citizenship", value: data.citizenship ?? "—" },
            { label: "ID number", value: data.id_number ?? "—" },
          ]
        : [],
      raw: res,
    };
  }

  if (identifierType === "bank") {
    const data = wrapper.data as CreditinfoBankAccountData;
    return {
      ...EMPTY,
      matched: success && !!data?.account_number,
      fullName: data?.account_name ?? null,
      idNumber: data?.account_number ?? "",
      fields: [
        { label: "Account name", value: data?.account_name ?? "—" },
        { label: "Account number", value: data?.account_number ?? "—" },
        { label: "Bank name", value: data?.bank_name ?? "—" },
      ],
      raw: res,
    };
  }

  if (identifierType === "krapin") {
    const data = wrapper.data as CreditinfoKraPinData;
    return {
      ...EMPTY,
      matched: success && !!data?.PINNo,
      fullName: data?.TaxpayerName ?? null,
      idNumber: data?.PINNo ?? "",
      fields: [
        { label: "Taxpayer name", value: data?.TaxpayerName ?? "—" },
        { label: "KRA PIN", value: data?.PINNo ?? "—" },
        { label: "Trading name", value: data?.Trading_Business_Name ?? "—" },
        { label: "Station", value: data?.Station ?? "—" },
        { label: "Locality", value: data?.Locality ?? "—" },
      ],
      raw: res,
    };
  }

  if (identifierType === "dl") {
    const data = (wrapper.data as { data: CreditinfoDrivingLicenseData })?.data;
    const valid = data?.dl_status === "valid" || data?.status === "valid";
    return {
      ...EMPTY,
      matched: success && valid,
      fullName: data?.full_name ?? null,
      gender: data?.sex ?? null,
      dateOfBirth: data?.date_of_birth ?? null,
      citizenship: data?.nationality ?? null,
      idNumber: data?.license_number ?? "",
      fields: [
        { label: "Full name", value: data?.full_name ?? "—" },
        { label: "License number", value: data?.license_number ?? "—" },
        { label: "National ID", value: data?.national_id ?? "—" },
        { label: "Class", value: data?.dlclass ?? "—" },
        { label: "Status", value: data?.dl_status ?? data?.status ?? "—" },
        { label: "Date of issue", value: data?.date_of_issue ?? "—" },
        { label: "Date of expiry", value: data?.date_of_expiry ?? "—" },
        { label: "Nationality", value: data?.nationality ?? "—" },
      ],
      raw: res,
    };
  }

  if (identifierType === "plate") {
    const data = wrapper.data as CreditinfoVehicleData;
    const owner = data?.owner;
    const vehicle = data?.vehicle;
    const ownerName = owner
      ? [owner.FIRSTNAME, owner.MIDDLENAME, owner.LASTNAME].filter(Boolean).join(" ")
      : "";
    return {
      ...EMPTY,
      matched: success && vehicle?.regStatus === "REGISTERED",
      fullName: ownerName || null,
      idNumber: data?.regNo ?? "",
      fields: [
        { label: "Registration No", value: data?.regNo ?? "—" },
        { label: "Owner name", value: ownerName || "—" },
        { label: "Owner ID number", value: owner?.ID_NUMBER ?? "—" },
        { label: "Make", value: vehicle?.carMake ?? "—" },
        { label: "Model", value: vehicle?.carModel ?? "—" },
        { label: "Body color", value: vehicle?.bodyColor ?? "—" },
        { label: "Registration status", value: vehicle?.regStatus ?? "—" },
      ],
      raw: res,
    };
  }

  return { ...EMPTY, raw: res };
}

export function mapPhoneResponse(res: CreditinfoPhoneEndQueryResponse): PhoneVerificationResult {
  const response = requireResponseEnvelope(res, "phone");
  const info = response.GeneralInformation as
    | { MobileNumberVerificationStatus?: string; InputMobileNumber?: string }
    | undefined;
  return {
    matched: info?.MobileNumberVerificationStatus === "Matched",
    mobileNumber: info?.InputMobileNumber ?? "",
    raw: res,
  };
}

export function mapBusinessResponse(
  res: CreditinfoBusinessEndQueryResponse
): BusinessVerificationResult {
  const response = requireResponseEnvelope(res, "business");
  const identifyAfrica = response.IdmIdentifyAfrica as
    | { data?: { response?: { data?: CreditinfoBusinessData } } }
    | undefined;
  const data = identifyAfrica?.data?.response?.data;
  const rawOwners = data?.beneficial_owners;
  const owners: BeneficialOwner[] = (Array.isArray(rawOwners) ? rawOwners : rawOwners ? [rawOwners] : []).map(
    (o) => ({
      name: o.name,
      role: o.type,
      idType: o.id_type ?? null,
      idNumber: o.id_number ?? null,
      ownershipPercentage: o.ownership_percentage ? Number(o.ownership_percentage) : null,
    })
  );

  return {
    matched: data?.status === "registered",
    status: data?.status ?? null,
    businessName: data?.business_name ?? null,
    registrationDate: data?.registration_date ?? null,
    physicalAddress: data?.physical_address ?? null,
    postalAddress: data?.postal_address ?? null,
    beneficialOwners: owners,
    raw: res,
  };
}
