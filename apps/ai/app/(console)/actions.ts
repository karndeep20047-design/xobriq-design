"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

// Marks the moment a staff member last opened the console notification
// bell — the badge count (app/(console)/layout.tsx) is "items new since
// this timestamp," not the raw pending count, so it actually clears once
// viewed instead of only dropping when the underlying item is actioned.
export async function markConsoleNotificationsSeenAction() {
  const user = await getCurrentUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ console_notifications_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/console", "layout");
}
