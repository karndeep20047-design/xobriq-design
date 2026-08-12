// apps/ai/lib/consultant/schema.ts
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { CONSULTANT_ROLE_SLUGS } from "./roles";

// Unicode-aware — allows accented/international names — but still a real
// character allowlist, not just a length cap: letters, marks (accents),
// spaces, apostrophes, periods, and hyphens only.
const NAME_RE = /^[\p{L}\p{M}\s'.-]+$/u;

export const ConsultantApplicationSchema = z
  .object({
    role: z.enum(CONSULTANT_ROLE_SLUGS, { message: "Select a role" }),
    full_name: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(150, "Name is too long")
      .regex(NAME_RE, "Name contains invalid characters"),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20, "Phone number is too long")
      .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number, including country code"),
    country: z.string().trim().min(2, "Enter your country of residence").max(100),
    degree: z.string().trim().min(2, "Enter your highest degree and field").max(200),
    institution: z.string().trim().min(2, "Enter your institution and year").max(200),
    total_years: z
      .string()
      .trim()
      .min(1, "Enter your total years of ICT experience")
      .transform((v) => Number(v))
      .pipe(z.number().int().min(0, "Must be 0 or more").max(60, "That seems too high — check the number")),
    relevant_years: z
      .string()
      .trim()
      .min(1, "Enter your years relevant to this role")
      .transform((v) => Number(v))
      .pipe(z.number().int().min(0, "Must be 0 or more").max(60, "That seems too high — check the number")),
    certifications: z.string().trim().max(500).optional().or(z.literal("")),
    registration_number: z.string().trim().max(100).optional().or(z.literal("")),
    portfolio_url: z.string().trim().url("Enter a valid URL").max(300).optional().or(z.literal("")),
    reference_1: z.string().trim().min(2, "Provide a reference — name and contact").max(300),
    reference_2: z.string().trim().min(2, "Provide a second reference — name and contact").max(300),
    job_background: z.string().trim().max(2000).optional().or(z.literal("")),
    consent: z.string().refine((v) => v === "on", "You must consent to proceed"),
    website: z.string().optional(), // honeypot
  })
  .refine((data) => data.relevant_years <= data.total_years, {
    message: "Years relevant to this role can't exceed total years of experience",
    path: ["relevant_years"],
  });

export type ConsultantApplicationData = z.infer<typeof ConsultantApplicationSchema>;
