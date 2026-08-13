
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ffxzstaufbdrptapuunc.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmeHpzdGF1ZmJkcnB0YXB1dW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI1MTE2MDAsImV4cCI6MjAxODA3NzYwMH0.placeholder";

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
