import { notFound } from "next/navigation";
import { requireOrgPermission } from "@/lib/permissions";
import { DEVELOPER_PRODUCTS, isDeveloperProductSlug } from "../product-config";
import { WorkspaceHeader } from "./WorkspaceHeader";

export default async function DeveloperProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ product: string }>;
}) {
  await requireOrgPermission("api_keys");
  const { product } = await params;

  if (!isDeveloperProductSlug(product)) notFound();
  const config = DEVELOPER_PRODUCTS[product];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <WorkspaceHeader config={config} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
