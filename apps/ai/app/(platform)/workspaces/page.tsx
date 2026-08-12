import { redirect } from "next/navigation";

// Workspaces (Sandbox/Production environment summary) merged directly into
// /api-keys — same underlying api_keys data, now one page instead of two.
// This redirect just keeps any old bookmarks/links pointed at /workspaces
// working rather than 404ing.
export default function WorkspacesPage() {
  redirect("/api-keys");
}
