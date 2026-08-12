// apps/ai/lib/consultant/roles.ts
// Single source of truth for the 7 Key Expert roster positions — shared by
// the careers page display, the application form's role selector, and the
// Zod validation schema, so they can't drift out of sync with each other.

export const CONSULTANT_ROLES = [
  {
    slug: "pm",
    title: "ICT Project Manager / Team Leader",
    weight: 12,
    qualifications:
      "Master's degree in ICT, Computer Science, Information Systems, or Engineering; minimum 15 years post-qualification ICT experience; minimum 5 years leading multi-disciplinary ICT consulting teams; PMP or PRINCE2 certified; registered ICT expert (ICTA or equivalent).",
  },
  {
    slug: "architect",
    title: "Enterprise / Solutions Architect",
    weight: 10,
    qualifications:
      "Degree in ICT or Engineering; minimum 10 years in enterprise architecture or solutions design; proficiency in architecture frameworks (TOGAF, Zachman); experience with government or large-scale enterprise environments; TOGAF 9 certification preferred.",
  },
  {
    slug: "cyber",
    title: "Cybersecurity and Data Protection Specialist",
    weight: 8,
    qualifications:
      "Degree in ICT or Information Security; minimum 8 years specialising in cybersecurity; CISSP, CISM, or CEH certification; familiarity with the Kenya Cybersecurity Framework (NACSA), ISO 27001, and ODPC data governance requirements.",
  },
  {
    slug: "developer",
    title: "Software / Systems Developer (Lead)",
    weight: 8,
    qualifications:
      "Bachelor's degree minimum in Computer Science or Software Engineering; minimum 8 years in software development; demonstrated experience with modern stacks (e.g. Java, Python, .NET, mobile/USSD); CI/CD pipeline and DevOps experience; Agile/Scrum certification preferred.",
  },
  {
    slug: "dba",
    title: "Database Administrator / Data Engineer",
    weight: 6,
    qualifications:
      "Degree in ICT or Statistics; minimum 7 years in database design, data warehousing, or ETL pipeline management; experience with SQL and NoSQL platforms; familiarity with open data standards (e.g. SDMX, IATI) an advantage.",
  },
  {
    slug: "change",
    title: "Change Management and Capacity Building Specialist",
    weight: 6,
    qualifications:
      "Degree in ICT, Organisational Development, or a related field; minimum 7 years in ICT change management and end-user training; demonstrated delivery of structured training programmes; Prosci ADKAR or equivalent certification.",
  },
  {
    slug: "other",
    title: "Other Key Experts (per Terms of Reference)",
    weight: 5,
    qualifications:
      "Network Engineer, GIS Specialist, M&E Specialist, or other specialists as required by specific engagements. Minimum qualifications and experience years assessed per individual position and assignment.",
  },
] as const;

export type ConsultantRoleSlug = (typeof CONSULTANT_ROLES)[number]["slug"];

export const CONSULTANT_ROLE_SLUGS = CONSULTANT_ROLES.map((r) => r.slug) as [ConsultantRoleSlug, ...ConsultantRoleSlug[]];

export function consultantRoleTitle(slug: string): string {
  return CONSULTANT_ROLES.find((r) => r.slug === slug)?.title || slug;
}
