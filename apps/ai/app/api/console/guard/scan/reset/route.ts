import { NextResponse } from "next/server";
import { requireGuardApiAccess } from "@/lib/guard/api-auth";

export async function POST() {
  const auth = await requireGuardApiAccess();
  if (!auth.ok) return auth.response;

  const res = await fetch(`${process.env.XOBRIQ_GUARD_API_URL}/scan/reset`, { method: "POST" });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
