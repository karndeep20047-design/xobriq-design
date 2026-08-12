import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <PageHeader Icon={MessageCircle} title={`Conversation ${id}`} subtitle="AI analysis and message history." />
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-border bg-bg-subtle p-5 text-sm">
          <span className="font-semibold text-fg-muted">User:</span> Analyze suspicious transaction batch.
        </div>
        <div className="rounded-2xl border border-border bg-bg-subtle p-5 text-sm">
          <span className="font-semibold text-enterprise-primary">AI:</span> I found high-risk patterns across device velocity and location anomalies.
        </div>
      </div>
    </div>
  );
}
