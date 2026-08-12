import { describe, it, expect } from "vitest";
import { mapBusinessResponse, mapIdentityResponse, mapPhoneResponse } from "./mapper";
import { CreditinfoResponseFormatError } from "./errors";
import type {
  CreditinfoBusinessEndQueryResponse,
  CreditinfoIdentityEndQueryResponse,
  CreditinfoPhoneEndQueryResponse,
} from "./types";

// Real incident this guards against: Data.response was assumed to always
// exist (see types.ts) but a real EndQuery body can omit it — production hit
// this and crashed with "Cannot read properties of undefined (reading
// 'IdmIdentifyAfrica')" instead of a diagnosable, typed error.

function identityFixture(idNumber: string, name: string): CreditinfoIdentityEndQueryResponse {
  return {
    Data: {
      response: {
        status: "ok",
        IdmIdentifyAfrica: {
          status: "ok",
          data: {
            response: {
              success: "true",
              response_code: "200",
              message: "ok",
              request_id: "req_1",
              data: {
                first_name: name.split(" ")[0],
                last_name: name.split(" ")[1] ?? "",
                other_name: null,
                gender: "MALE",
                dob: "1990-01-01",
                citizenship: "KENYAN",
                id_number: idNumber,
                serial_no: null,
                valid: "true",
                name,
              },
            },
          },
        },
        Strategy: { Id: "1", Name: "XOBRIQ - KYC", BeeStrategy: "", TemplateName: "", SubscriberId: "", ReturnOutputDataInSteps: "" },
      },
    },
    Timestamp: "2026-01-01T00:00:00Z",
  } as CreditinfoIdentityEndQueryResponse;
}

describe("mapIdentityResponse", () => {
  it("maps a well-formed match", () => {
    const result = mapIdentityResponse(identityFixture("1234567", "JAMIE JOHNSON"), "national_id");
    expect(result.matched).toBe(true);
    expect(result.fullName).toBe("JAMIE JOHNSON");
    expect(result.idNumber).toBe("1234567");
  });

  it("returns a graceful no-match when Data.response exists but IdmIdentifyAfrica is legitimately absent", () => {
    const res = {
      Data: { response: { status: "ok", Strategy: {} } },
      Timestamp: "2026-01-01T00:00:00Z",
    } as unknown as CreditinfoIdentityEndQueryResponse;

    const result = mapIdentityResponse(res, "national_id");
    expect(result.matched).toBe(false);
    expect(result.raw).toEqual(res);
  });

  it("throws a typed CreditinfoResponseFormatError (not a raw TypeError) when Data.response is missing", () => {
    const res = { Data: { Status: "Failure" }, Timestamp: "2026-01-01T00:00:00Z" } as unknown as CreditinfoIdentityEndQueryResponse;

    expect(() => mapIdentityResponse(res, "national_id")).toThrow(CreditinfoResponseFormatError);
    try {
      mapIdentityResponse(res, "national_id");
      throw new Error("expected mapIdentityResponse to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(CreditinfoResponseFormatError);
      expect((err as CreditinfoResponseFormatError).code).toBe("CREDITINFO_RESPONSE_FORMAT_ERROR");
      expect((err as Error).message).not.toContain("Cannot read properties");
    }
  });

  it("throws CreditinfoResponseFormatError when Data itself is missing", () => {
    const res = { Timestamp: "2026-01-01T00:00:00Z" } as unknown as CreditinfoIdentityEndQueryResponse;
    expect(() => mapIdentityResponse(res, "national_id")).toThrow(CreditinfoResponseFormatError);
  });

  it("throws CreditinfoResponseFormatError instead of crashing on a non-object body", () => {
    expect(() => mapIdentityResponse(null as unknown as CreditinfoIdentityEndQueryResponse, "national_id")).toThrow(
      CreditinfoResponseFormatError
    );
    expect(() => mapIdentityResponse(undefined as unknown as CreditinfoIdentityEndQueryResponse, "national_id")).toThrow(
      CreditinfoResponseFormatError
    );
  });

  it("keeps two verifications for different people fully independent — no shared/cached state", () => {
    const jamie = mapIdentityResponse(identityFixture("1111111", "JAMIE JOHNSON"), "national_id");
    const maria = mapIdentityResponse(identityFixture("2222222", "MARIA JAMES"), "national_id");

    expect(jamie.fullName).toBe("JAMIE JOHNSON");
    expect(jamie.idNumber).toBe("1111111");
    expect(maria.fullName).toBe("MARIA JAMES");
    expect(maria.idNumber).toBe("2222222");
    expect(jamie.fullName).not.toBe(maria.fullName);
  });
});

describe("mapPhoneResponse", () => {
  const validRes: CreditinfoPhoneEndQueryResponse = {
    Data: {
      response: {
        status: "ok",
        infomsg: "",
        GeneralInformation: {
          RequestDate: "2026-01-01",
          ReferenceNumber: "ref_1",
          InputMobileNumber: "254700000000",
          MobileNumberVerificationStatus: "Matched",
        },
        PersonalInformation: null,
        Strategy: { Id: "2", Name: "XOBRIQ - Phone", BeeStrategy: "", TemplateName: "", SubscriberId: "", ReturnOutputDataInSteps: "" },
      },
    },
    Timestamp: "2026-01-01T00:00:00Z",
  };

  it("maps a well-formed match", () => {
    const result = mapPhoneResponse(validRes);
    expect(result.matched).toBe(true);
    expect(result.mobileNumber).toBe("254700000000");
  });

  it("throws CreditinfoResponseFormatError when Data.response is missing", () => {
    const res = { Data: {}, Timestamp: "2026-01-01T00:00:00Z" } as unknown as CreditinfoPhoneEndQueryResponse;
    expect(() => mapPhoneResponse(res)).toThrow(CreditinfoResponseFormatError);
  });
});

describe("mapBusinessResponse", () => {
  const validRes: CreditinfoBusinessEndQueryResponse = {
    Data: {
      response: {
        status: "ok",
        IdmIdentifyAfrica: {
          status: "ok",
          data: {
            response: {
              success: "true",
              response_code: "200",
              message: "ok",
              data: {
                status: "registered",
                registration_date: "2020-01-01",
                postal_address: null,
                physical_address: null,
                phone_number: null,
                kra_pin: null,
                email: null,
                business_name: "Acme Ltd",
                share_capital: null,
                partners: [],
                beneficial_owners: [
                  { name: "Jamie Johnson", type: "Director", id_type: "national_id", id_number: "1111111", ownership_percentage: "100" },
                ],
                ubo_summary: null,
              },
            },
          },
        },
        Strategy: { Id: "3", Name: "XOBRIQ - BRS + UBO", BeeStrategy: "", TemplateName: "", SubscriberId: "", ReturnOutputDataInSteps: "" },
      },
    },
    Timestamp: "2026-01-01T00:00:00Z",
  };

  it("maps a well-formed match including beneficial owners", () => {
    const result = mapBusinessResponse(validRes);
    expect(result.matched).toBe(true);
    expect(result.businessName).toBe("Acme Ltd");
    expect(result.beneficialOwners).toHaveLength(1);
    expect(result.beneficialOwners[0].name).toBe("Jamie Johnson");
  });

  it("throws CreditinfoResponseFormatError when Data.response is missing", () => {
    const res = { Data: {}, Timestamp: "2026-01-01T00:00:00Z" } as unknown as CreditinfoBusinessEndQueryResponse;
    expect(() => mapBusinessResponse(res)).toThrow(CreditinfoResponseFormatError);
  });
});
