import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInquiryMails } from "@/lib/email/send-inquiry-mails";
import { classifyDepartment } from "@/lib/email/routing";
import { corsHeaders } from "@/lib/cors";
import { isIpRateLimited } from "@/lib/rate-limit";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════

const InquirySchema = z.object({
  type: z.enum([
    "contact",
    "demo_request",
    "pricing_inquiry",
    "discovery_call",
    "partnership",
    "press",
    "security_disclosure",
    "support",
  ]),
  source_site: z.enum(["xobriq.com", "xobriq.ai"]).default("xobriq.com"),
  source_page: z.string().max(200).optional(),
  full_name: z.string().min(2).max(200),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  industry: z.string().max(120).optional(),
  message: z.string().max(5000).optional(),
  interested_products: z.array(z.string()).optional(),
  budget_range: z.string().max(80).optional(),
  preferred_date: z.string().max(20).optional(),
  preferred_time: z.string().max(20).optional(),
  urgency: z.enum(["urgent", "high", "normal", "low"]).default("normal"),
  metadata: z.record(z.string(), z.any()).optional(),
  website: z.string().optional(), // honeypot
});

// ═══════════════════════════════════════════════════════════════════════
// POST — receive inquiry, save to Supabase, trigger emails (awaited)
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const body = await req.json();

    console.log("[inquiries] POST received from origin:", origin, "type:", body.type);

    // Honeypot: silently succeed for bots
    if (body.website && body.website.length > 0) {
      return NextResponse.json({ ok: true }, { headers });
    }

    const parsed = InquirySchema.safeParse(body);
    if (!parsed.success) {
      console.error("[inquiries] validation failed:", parsed.error.issues[0]?.message);
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400, headers }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = req.headers.get("user-agent") || null;

    const admin = createAdminClient();
    if (await isIpRateLimited(admin, ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests — please try again in a minute." },
        { status: 429, headers }
      );
    }

    // Persisted (not just used for email routing) so the console can enforce
    // HR-vs-sales visibility server-side — see inquiryDepartmentsForRole() in
    // lib/session-types.ts. Every insert path computes this itself at write
    // time (contact/actions.ts and careers/actions.ts do the same
    // classifyDepartment() call before their own inserts) rather than storing
    // a value one path produces and the others reuse — there's no shared
    // "create inquiry" function to centralize it in.
    const department = classifyDepartment({
      type: parsed.data.type,
      message: parsed.data.message,
      interested_products: parsed.data.interested_products,
    });

    const { data, error } = await admin
      .from("inquiries")
      .insert({
        type: parsed.data.type,
        source_site: parsed.data.source_site,
        source_page: parsed.data.source_page,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        company: parsed.data.company,
        phone: parsed.data.phone,
        industry: parsed.data.industry,
        message: parsed.data.message,
        interested_products: parsed.data.interested_products || [],
        budget_range: parsed.data.budget_range,
        urgency: parsed.data.urgency,
        // preferred_date/preferred_time have no dedicated column (no migration
        // exists to add one against the live schema), so they ride inside the
        // existing metadata jsonb catch-all rather than risk an insert failure
        // from an unknown column name.
        metadata: {
          ...(parsed.data.metadata || {}),
          ...(parsed.data.preferred_date ? { preferred_date: parsed.data.preferred_date } : {}),
          ...(parsed.data.preferred_time ? { preferred_time: parsed.data.preferred_time } : {}),
        },
        department,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[inquiries] Insert error:", error.message);
      return NextResponse.json(
        { ok: false, error: "Failed to save inquiry" },
        { status: 500, headers }
      );
    }

    console.log("[inquiries] saved with id:", data.id);

    // Log for audit (fire-and-forget is fine here — audit is nice-to-have)
    admin
      .from("audit_logs")
      .insert({
        action: "inquiry.created",
        resource_type: "inquiry",
        resource_id: data.id,
        metadata: {
          type: parsed.data.type,
          source_site: parsed.data.source_site,
          email: parsed.data.email,
        },
        ip_address: ip,
        user_agent: userAgent,
      })
      .then(
        () => null,
        () => null
      );

    // Send emails — AWAIT so the function doesn't terminate before Graph responds
    const consoleUrl =
      (process.env.NEXT_PUBLIC_APP_URL ||
        "https://xobriq-ai-psi.vercel.app") +
      "/console/inquiries/" +
      data.id;

    console.log("[inquiries] triggering sendInquiryMails for id:", data.id);

    try {
      await sendInquiryMails({
        id: data.id,
        type: parsed.data.type,
        source_site: parsed.data.source_site,
        source_page: parsed.data.source_page || null,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        phone: parsed.data.phone || null,
        industry: parsed.data.industry || null,
        message: parsed.data.message || null,
        interest: null,
        interested_products: parsed.data.interested_products || null,
        budget_range: parsed.data.budget_range || null,
        preferred_date: parsed.data.preferred_date || null,
        preferred_time: parsed.data.preferred_time || null,
        urgency: parsed.data.urgency || null,
        ip_address: ip,
        consoleUrl,
      });
      console.log("[inquiries] sendInquiryMails completed for id:", data.id);
    } catch (mailErr) {
      // Log but don't fail — the inquiry was saved successfully
      console.error("[inquiries] sendInquiryMails FAILED for id:", data.id);
      console.error("[inquiries] error:", mailErr instanceof Error ? mailErr.message : String(mailErr));
    }

    return NextResponse.json({ ok: true, id: data.id }, { headers });
  } catch (err) {
    console.error("[inquiries] fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500, headers }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GET — method not allowed
// ═══════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405, headers: corsHeaders(req.headers.get("origin")) }
  );
}
