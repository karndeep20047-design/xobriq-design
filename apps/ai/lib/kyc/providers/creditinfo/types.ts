// Raw Creditinfo IDM shapes, captured directly from the sandbox
// (https://idmtest.creditinfo.co.ke) — not guessed. Each strategy is a
// separate "product" behind the same BeginQuery/EndQuery envelope:
//   POST {baseUrl}/{strategyId}  -> { Token, Timestamp }
//   GET  {baseUrl}/{Token}       -> the strategy's own result shape below

export type CreditinfoBeginQueryResponse = {
  Token: string;
  Timestamp: string;
};

// A failed BeginQuery/EndQuery call (bad auth, bad strategy id, etc.) comes
// back as a .NET WebAPI unhandled-exception body, not a normal error payload.
export type CreditinfoErrorResponse = {
  Message: string;
  ExceptionMessage?: string;
  ExceptionType?: string;
  StackTrace?: string;
};

export type CreditinfoIdentifierType =
  | "national_id"
  | "krapinalien_id"
  | "krapin"
  | "bank"
  | "plate"
  | "dl";

// The "XOBRIQ - KYC" strategy's `data` shape depends entirely on which
// IdentifierType was submitted — these are five genuinely different
// payloads behind the same envelope, captured directly from the Creditinfo
// sandbox (not guessed):

// national_id / krapinalien_id (Alien ID) — identical shape for both.
export type CreditinfoNationalIdData = {
  first_name: string | null;
  last_name: string | null;
  other_name: string | null;
  gender: string | null;
  dob: string | null;
  citizenship: string | null;
  id_number: string;
  serial_no: string | null;
  // Creditinfo returns this as the literal string "true"/"false", not a boolean
  valid: "true" | "false" | string;
  name: string | null;
};

export type CreditinfoBankAccountData = {
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
};

export type CreditinfoKraPinData = {
  PINNo: string | null;
  TaxpayerName: string | null;
  Trading_Business_Name: string | null;
  Station: string | null;
  Locality: string | null;
  Business_Certificate_Id: string | null;
  Email_Addresses: string | null;
  Partnership: string | null;
  Paye: string | null;
  Tot: string | null;
  Vat: string | null;
};

// Sandbox quirk confirmed against a real response: this one comes back with
// an extra nested "data" level that none of the other identifier types have
// (response.data.data.{fields}, not response.data.{fields}).
export type CreditinfoDrivingLicenseData = {
  full_name: string | null;
  license_number: string | null;
  national_id: string | null;
  dl_status: string | null;
  status: string | null;
  dlclass: string | null;
  sex: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  date_of_issue: string | null;
  date_of_expiry: string | null;
  blood_group: string | null;
  phoneNumber: string | null;
};

export type CreditinfoVehicleData = {
  regNo: string | null;
  chassisNumber: string | null;
  owner: {
    FIRSTNAME: string | null;
    MIDDLENAME: string | null;
    LASTNAME: string | null;
    ID_NUMBER: string | null;
    PIN: string | null;
    TOWN: string | null;
  } | null;
  vehicle: {
    carMake: string | null;
    carModel: string | null;
    bodyColor: string | null;
    bodyType: string | null;
    regStatus: string | null;
    yearOfManufacture: string | null;
    engineNumber: string | null;
  } | null;
};

// EndQuery result for the "XOBRIQ - KYC" strategy (identity lookup).
export type CreditinfoIdentityEndQueryResponse = {
  Data: {
    response: {
      status: "ok" | string;
      IdmIdentifyAfrica?: {
        status: "ok" | string;
        data: {
          response: {
            success: "true" | "false" | string;
            response_code: string;
            message: string;
            request_id: string;
            data:
              | CreditinfoNationalIdData
              | CreditinfoBankAccountData
              | CreditinfoKraPinData
              | CreditinfoVehicleData
              // dl nests an extra "data" level — see CreditinfoDrivingLicenseData
              | { data: CreditinfoDrivingLicenseData };
          };
        };
      };
      Strategy: CreditinfoStrategyMeta;
    };
  };
  Timestamp: string;
};

// EndQuery result for the "XOBRIQ - Phone" strategy (mobile number match).
export type CreditinfoPhoneEndQueryResponse = {
  Data: {
    response: {
      status: "ok" | string;
      infomsg: string;
      GeneralInformation: {
        RequestDate: string;
        ReferenceNumber: string;
        InputMobileNumber: string;
        MobileNumberVerificationStatus: "Matched" | "NotMatched" | string;
      };
      PersonalInformation: unknown | null;
      Strategy: CreditinfoStrategyMeta;
    };
  };
  Timestamp: string;
};

export type CreditinfoBeneficialOwner = {
  name: string;
  type: string;
  id_type: string;
  id_number: string;
  ownership_percentage: string;
};

export type CreditinfoBusinessData = {
  status: string; // e.g. "registered"
  registration_date: string | null;
  postal_address: string | null;
  physical_address: string | null;
  phone_number: string | null;
  kra_pin: string | null;
  email: string | null;
  business_name: string | null;
  share_capital: {
    number_of_shares: string;
    nominal_value: string;
    name: string;
  } | null;
  partners: Array<{
    type: string; // "Director" | "Secretary" | ...
    shares: { number_of_shares: string; name: string } | null;
    postal_code: string | null;
    postal_address: string | null;
    phone_number: string | null;
    name: string;
    id_type: string | null;
    id_number: string | null;
    gender: string | null;
    email: string | null;
  }>;
  beneficial_owners: CreditinfoBeneficialOwner | CreditinfoBeneficialOwner[] | null;
  ubo_summary: {
    total_shares: string | null;
    threshold_percentage: string | null;
    api_identified_count: string | null;
    calculated_count: string | null;
    total_ubos: string | null;
  } | null;
};

// EndQuery result for the "XOBRIQ - BRS + UBO" strategy (business registration
// + ultimate beneficial owners).
export type CreditinfoBusinessEndQueryResponse = {
  Data: {
    response: {
      status: "ok" | string;
      IdmIdentifyAfrica?: {
        status: "ok" | string;
        data: {
          response: {
            success: "true" | "false" | string;
            response_code: string;
            message: string;
            data: CreditinfoBusinessData;
          };
        };
      };
      Strategy: CreditinfoStrategyMeta;
      ConsolidatedReport?: unknown;
    };
  };
  Timestamp: string;
};

export type CreditinfoStrategyMeta = {
  Id: string;
  Name: string;
  BeeStrategy: string;
  TemplateName: string;
  SubscriberId: string;
  ReturnOutputDataInSteps: string;
};
