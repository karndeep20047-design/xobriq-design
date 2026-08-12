import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <PageHeader Icon={FolderKanban} title={`Project ${id}`} subtitle="Project conversations and AI activity." />
      <div className="mt-6 rounded-2xl border border-border bg-bg-subtle p-6">
        <p className="text-sm text-fg-muted">Project conversations and AI activity will appear here.</p>
      </div>
    </div>
  );
}
