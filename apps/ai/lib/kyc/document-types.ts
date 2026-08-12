import {
  Car,
  CreditCard,
  Fingerprint,
  Globe2,
  IdCard,
  Landmark,
  Receipt,
} from "lucide-react";

// Single source of truth for the identity-document types the verify form
// accepts. Extracted from VerifyClient so the ID capture dialog
// (components/kyc/id-scan-dialog.tsx) can render the same picker, hints and
// validation rules without duplicating them — the two drifting apart would
// mean the dialog happily accepting a value the form then rejects.
//
// `supported` reflects what the Creditinfo IPRS strategy can actually query;
// unsupported types are still listed so the UI can show them as disabled
// rather than silently omitting a document a user is holding.

export type DocType =
  | "national_id"
  | "passport"
  | "alien_id"
  | "krapin"
  | "bank"
  | "dl"
  | "plate";

export type DocMetaEntry = {
  label: string;
  /** Short label for tight spaces (pickers, chips). */
  shortLabel: string;
  hint: string;
  placeholder: string;
  example: string;
  icon: React.ComponentType<{ className?: string }>;
  pattern: RegExp;
  minLen: number;
  maxLen: number;
  normalize: (v: string) => string;
  supported: boolean;
};

export const docMeta: Record<DocType, DocMetaEntry> = {
  national_id: {
    label: "Kenyan National ID",
    shortLabel: "National ID",
    hint: "8-digit National ID number as printed on the ID card.",
    placeholder: "e.g. 29184023",
    example: "29184023",
    icon: CreditCard,
    pattern: /^\d{7,9}$/,
    minLen: 7,
    maxLen: 9,
    normalize: (v) => v.replace(/\D/g, "").slice(0, 9),
    supported: true,
  },
  passport: {
    label: "Kenyan Passport",
    shortLabel: "Passport",
    hint: "Not supported by this IPRS strategy yet.",
    placeholder: "e.g. AK1234567",
    example: "AK1234567",
    icon: Globe2,
    pattern: /^[A-Z]{1,2}\d{6,8}$/,
    minLen: 7,
    maxLen: 10,
    normalize: (v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10),
    supported: false,
  },
  alien_id: {
    label: "Alien / Foreigner ID",
    shortLabel: "Alien ID",
    hint: "7 to 9 digit Alien registration number.",
    placeholder: "e.g. 100482915",
    example: "100482915",
    icon: Fingerprint,
    pattern: /^\d{6,10}$/,
    minLen: 6,
    maxLen: 10,
    normalize: (v) => v.replace(/\D/g, "").slice(0, 10),
    supported: true,
  },
  krapin: {
    label: "KRA PIN",
    shortLabel: "KRA PIN",
    hint: "11-character KRA PIN, e.g. business or individual tax PIN.",
    placeholder: "e.g. A123456789A",
    example: "A123456789A",
    icon: Receipt,
    pattern: /^[A-Za-z0-9]{6,11}$/,
    minLen: 6,
    maxLen: 11,
    normalize: (v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11),
    supported: true,
  },
  bank: {
    label: "Bank Account",
    shortLabel: "Bank",
    hint: "Bank account number to verify against IPRS's bank register.",
    placeholder: "e.g. 12345678",
    example: "12345678",
    icon: Landmark,
    pattern: /^[A-Za-z0-9]{5,20}$/,
    minLen: 5,
    maxLen: 20,
    normalize: (v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 20),
    supported: true,
  },
  dl: {
    label: "Driving License",
    shortLabel: "Driving License",
    hint: "Driving license number as printed on the license.",
    placeholder: "e.g. 12345678",
    example: "12345678",
    icon: IdCard,
    pattern: /^[A-Za-z0-9]{5,15}$/,
    minLen: 5,
    maxLen: 15,
    normalize: (v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 15),
    supported: true,
  },
  plate: {
    label: "Vehicle Plate",
    shortLabel: "Plate",
    hint: "Vehicle registration / number plate.",
    placeholder: "e.g. KAA 123A",
    example: "KAA123A",
    icon: Car,
    pattern: /^[A-Za-z0-9]{5,10}$/,
    minLen: 5,
    maxLen: 10,
    normalize: (v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10),
    supported: true,
  },
};

/** Order used by pickers — most common first. */
export const DOC_TYPE_ORDER: DocType[] = [
  "national_id",
  "alien_id",
  "krapin",
  "dl",
  "bank",
  "plate",
  "passport",
];

/** Only the types a document capture can sensibly be tagged as. */
export const CAPTURABLE_DOC_TYPES: DocType[] = [
  "national_id",
  "alien_id",
  "krapin",
  "dl",
  "passport",
];
