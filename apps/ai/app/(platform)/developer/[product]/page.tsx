import { redirect } from "next/navigation";

export default async function DeveloperProductIndexPage({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  redirect(`/developer/${product}/overview`);
}
