import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

export const metadata = {
  title: "Blog — Xobriq.AI",
  description: "Perspectives on sovereign intelligence from the Xobriq team.",
};

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string;
  tags: string[];
  category?: { name: string; slug: string; color: string } | null;
};

async function fetchPublished(): Promise<Post[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, published_at, tags, blog_categories(name, slug, color)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover_image_url: row.cover_image_url,
    published_at: row.published_at,
    tags: row.tags || [],
    category: row.blog_categories || null,
  }));
}

export default async function BlogPage() {
  const posts = await fetchPublished();

  if (posts.length === 0) {
    return (
      <div className="bg-enterprise-bg text-enterprise-fg">
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="label-caps-thin text-enterprise-accent">The Xobriq Journal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Nothing published yet.
            </h1>
            <p className="mt-4 text-enterprise-fg-muted">
              Check back soon — our editorial team is working on it.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <section className="px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="label-caps-thin text-enterprise-accent">The Xobriq Journal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Perspectives on sovereign intelligence.
          </h1>
          <p className="mt-4 max-w-2xl text-enterprise-fg-muted">
            Research, engineering deep dives, product releases, and field notes from the Xobriq team.
          </p>

          <Link
            href={"/blog/" + featured.slug}
            className="glass-panel group mt-14 grid gap-6 overflow-hidden rounded-3xl lg:grid-cols-2"
          >
            <div className="relative aspect-video lg:aspect-auto">
              {featured.cover_image_url ? (
                <Image
                  src={featured.cover_image_url}
                  alt={featured.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-enterprise-primary/20 to-enterprise-accent/10" />
              )}
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <span className="label-caps-thin text-enterprise-accent">
                Featured{featured.category ? " · " + featured.category.name : ""}
              </span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{featured.title}</h2>
              {featured.excerpt ? (
                <p className="mt-4 text-enterprise-fg-muted">{featured.excerpt}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xs text-enterprise-fg-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(featured.published_at).toLocaleDateString("en-KE", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1 text-enterprise-primary">
                  Read article <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>

          {rest.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  href={"/blog/" + p.slug}
                  className="glass-panel group flex flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-video">
                    {p.cover_image_url ? (
                      <Image
                        src={p.cover_image_url}
                        alt={p.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-enterprise-primary/15 to-enterprise-accent/10" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {p.category ? (
                      <span className="label-caps-thin text-enterprise-primary">
                        {p.category.name}
                      </span>
                    ) : null}
                    <h3 className="mt-3 font-semibold">{p.title}</h3>
                    {p.excerpt ? (
                      <p className="mt-2 flex-1 text-sm text-enterprise-fg-muted">
                        {p.excerpt}
                      </p>
                    ) : null}
                    <span className="mt-4 text-xs text-enterprise-fg-subtle">
                      {new Date(p.published_at).toLocaleDateString("en-KE", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
