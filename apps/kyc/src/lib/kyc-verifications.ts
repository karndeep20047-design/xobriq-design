export type VerificationStatus =
  | "Approved"
  | "Pending"
  | "Processing"
  | "Rejected"
  | "Flagged";

export type DocType = "National ID" | "Passport" | "Alien ID";

export type Verification = {
  ref: string;
  firstName: string;
  lastName: string;
  doc: DocType;
  numberMasked: string;
  numberFull: string;
  county: string;
  gender: "Male" | "Female";
  dob: string;
  status: VerificationStatus;
  score: number; // 0-100 match confidence
  date: string; // display date
  submittedAt: string; // ISO
  channel: "Dashboard" | "API" | "Mobile SDK";
  operator: string;
  riskFlags: string[];
  ipAddress: string;
  device: string;
  checks: { label: string; status: "pass" | "fail" | "warn"; detail: string }[];
  timeline: { at: string; label: string; note?: string }[];
};

export const statusStyles: Record<VerificationStatus, string> = {
  Approved: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning-foreground border-warning/30",
  Processing: "bg-info/10 text-info border-info/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  Flagged: "bg-destructive/15 text-destructive border-destructive/30",
};

const rawSeed: Omit<Verification, "checks" | "timeline">[] = [
  {
    ref: "HKY-24019281",
    firstName: "Wanjiku",
    lastName: "Kamau",
    doc: "National ID",
    numberMasked: "•• •• 4821",
    numberFull: "32874821",
    county: "Nairobi",
    gender: "Female",
    dob: "1994-03-12",
    status: "Approved",
    score: 98,
    date: "Today, 10:24",
    submittedAt: "2026-07-21T07:24:00Z",
    channel: "Dashboard",
    operator: "Jane M.",
    riskFlags: [],
    ipAddress: "41.90.12.44",
    device: "Chrome · macOS",
  },
  {
    ref: "HKY-24019282",
    firstName: "Brian",
    lastName: "Otieno",
    doc: "Passport",
    numberMasked: "AK•••7123",
    numberFull: "AK1247123",
    county: "Kisumu",
    gender: "Male",
    dob: "1990-11-02",
    status: "Pending",
    score: 74,
    date: "Today, 09:15",
    submittedAt: "2026-07-21T06:15:00Z",
    channel: "API",
    operator: "api://live_pk_82…",
    riskFlags: ["Manual review requested"],
    ipAddress: "197.232.44.19",
    device: "Server · Node 20",
  },
  {
    ref: "HKY-24019283",
    firstName: "Ali Hassan",
    lastName: "Mwangi",
    doc: "National ID",
    numberMasked: "•• •• 9042",
    numberFull: "29119042",
    county: "Mombasa",
    gender: "Male",
    dob: "1988-06-19",
    status: "Processing",
    score: 61,
    date: "Today, 08:45",
    submittedAt: "2026-07-21T05:45:00Z",
    channel: "Mobile SDK",
    operator: "sdk-android v2.1",
    riskFlags: [],
    ipAddress: "105.163.2.88",
    device: "Android 14 · Tecno",
  },
  {
    ref: "HKY-24019284",
    firstName: "Faith",
    lastName: "Chebet",
    doc: "National ID",
    numberMasked: "•• •• 2210",
    numberFull: "34562210",
    county: "Uasin Gishu",
    gender: "Female",
    dob: "1996-01-27",
    status: "Approved",
    score: 96,
    date: "Yesterday, 16:35",
    submittedAt: "2026-07-20T13:35:00Z",
    channel: "Dashboard",
    operator: "Jane M.",
    riskFlags: [],
    ipAddress: "41.90.99.10",
    device: "Chrome · Windows",
  },
  {
    ref: "HKY-24019285",
    firstName: "Peter",
    lastName: "Njoroge",
    doc: "Passport",
    numberMasked: "BK•••2298",
    numberFull: "BK9932298",
    county: "Nakuru",
    gender: "Male",
    dob: "1985-08-04",
    status: "Rejected",
    score: 22,
    date: "Yesterday, 15:12",
    submittedAt: "2026-07-20T12:12:00Z",
    channel: "API",
    operator: "api://live_pk_11…",
    riskFlags: ["Name mismatch", "Document expired"],
    ipAddress: "154.159.220.4",
    device: "Server · Python 3.11",
  },
  {
    ref: "HKY-24019286",
    firstName: "Amina",
    lastName: "Yusuf",
    doc: "Alien ID",
    numberMasked: "•• •• 0177",
    numberFull: "AL450177",
    county: "Garissa",
    gender: "Female",
    dob: "1992-05-30",
    status: "Flagged",
    score: 41,
    date: "Yesterday, 14:02",
    submittedAt: "2026-07-20T11:02:00Z",
    channel: "Dashboard",
    operator: "Kevin O.",
    riskFlags: ["PEP watchlist hit", "Duplicate submission (24h)"],
    ipAddress: "41.212.19.201",
    device: "Safari · iOS 18",
  },
  {
    ref: "HKY-24019287",
    firstName: "Grace",
    lastName: "Wambui",
    doc: "National ID",
    numberMasked: "•• •• 6634",
    numberFull: "31226634",
    county: "Nyeri",
    gender: "Female",
    dob: "1991-09-14",
    status: "Approved",
    score: 99,
    date: "Yesterday, 11:48",
    submittedAt: "2026-07-20T08:48:00Z",
    channel: "API",
    operator: "api://live_pk_82…",
    riskFlags: [],
    ipAddress: "197.232.51.6",
    device: "Server · Node 20",
  },
  {
    ref: "HKY-24019288",
    firstName: "Dennis",
    lastName: "Kiplagat",
    doc: "National ID",
    numberMasked: "•• •• 7712",
    numberFull: "33987712",
    county: "Kericho",
    gender: "Male",
    dob: "1993-12-01",
    status: "Approved",
    score: 94,
    date: "2 days ago, 09:20",
    submittedAt: "2026-07-19T06:20:00Z",
    channel: "Mobile SDK",
    operator: "sdk-ios v2.1",
    riskFlags: [],
    ipAddress: "105.163.44.2",
    device: "iOS 18 · iPhone 15",
  },
  {
    ref: "HKY-24019289",
    firstName: "Halima",
    lastName: "Abdi",
    doc: "Passport",
    numberMasked: "CK•••4410",
    numberFull: "CK7784410",
    county: "Wajir",
    gender: "Female",
    dob: "1987-04-22",
    status: "Pending",
    score: 68,
    date: "2 days ago, 08:02",
    submittedAt: "2026-07-19T05:02:00Z",
    channel: "Dashboard",
    operator: "Jane M.",
    riskFlags: ["Low image quality"],
    ipAddress: "41.90.14.9",
    device: "Chrome · Windows",
  },
  {
    ref: "HKY-24019290",
    firstName: "Samuel",
    lastName: "Mutiso",
    doc: "National ID",
    numberMasked: "•• •• 1188",
    numberFull: "30111188",
    county: "Machakos",
    gender: "Male",
    dob: "1989-02-17",
    status: "Approved",
    score: 91,
    date: "3 days ago, 14:44",
    submittedAt: "2026-07-18T11:44:00Z",
    channel: "API",
    operator: "api://live_pk_11…",
    riskFlags: [],
    ipAddress: "154.159.10.44",
    device: "Server · Go 1.22",
  },
];

function buildChecks(v: Omit<Verification, "checks" | "timeline">): Verification["checks"] {
  const iprsPass = v.status === "Approved" || v.status === "Pending" || v.status === "Processing";
  const nameMatch = !v.riskFlags.includes("Name mismatch");
  const expired = v.riskFlags.includes("Document expired");
  const dup = v.riskFlags.includes("Duplicate submission (24h)");
  const watchlist = v.riskFlags.includes("PEP watchlist hit");
  return [
    {
      label: "IPRS lookup",
      status: iprsPass ? "pass" : "fail",
      detail: iprsPass
        ? "Record found in Integrated Population Registration Services."
        : "No matching record returned by IPRS.",
    },
    {
      label: "Name match",
      status: nameMatch ? "pass" : "fail",
      detail: nameMatch
        ? `Last name "${v.lastName}" matches IPRS record.`
        : `Submitted last name does not match IPRS record.`,
    },
    {
      label: "Document validity",
      status: expired ? "fail" : "pass",
      detail: expired ? "Document expired on 2024-11-30." : "Document within valid period.",
    },
    {
      label: "Duplicate check (24h)",
      status: dup ? "warn" : "pass",
      detail: dup ? "Same document submitted 3 times in the last 24h." : "No duplicates detected.",
    },
    {
      label: "Sanctions / PEP screening",
      status: watchlist ? "fail" : "pass",
      detail: watchlist
        ? "Match found on regional PEP list — requires compliance review."
        : "No matches on OFAC, UN, EU or local PEP lists.",
    },
    {
      label: "ODPC consent",
      status: "pass",
      detail: "Data subject consent captured and stored.",
    },
  ];
}

function buildTimeline(v: Omit<Verification, "checks" | "timeline">): Verification["timeline"] {
  const base = new Date(v.submittedAt).getTime();
  const t = (offsetSec: number) => new Date(base + offsetSec * 1000).toISOString();
  const timeline: Verification["timeline"] = [
    { at: t(0), label: "Request received", note: `Channel: ${v.channel}` },
    { at: t(2), label: "IPRS lookup dispatched" },
    { at: t(6), label: "IPRS response received" },
    { at: t(8), label: "Sanctions & PEP screening completed" },
  ];
  if (v.status === "Approved") {
    timeline.push({ at: t(10), label: "Verification approved", note: `Confidence ${v.score}%` });
  } else if (v.status === "Rejected") {
    timeline.push({ at: t(10), label: "Verification rejected", note: v.riskFlags.join(" · ") });
  } else if (v.status === "Flagged") {
    timeline.push({ at: t(10), label: "Flagged for compliance review", note: v.riskFlags.join(" · ") });
  } else if (v.status === "Pending") {
    timeline.push({ at: t(10), label: "Queued for manual review" });
  } else {
    timeline.push({ at: t(10), label: "Processing…" });
  }
  return timeline;
}

export const verifications: Verification[] = rawSeed.map((v) => ({
  ...v,
  checks: buildChecks(v),
  timeline: buildTimeline(v),
}));

export function getVerification(ref: string): Verification | undefined {
  return verifications.find((v) => v.ref === ref);
}
