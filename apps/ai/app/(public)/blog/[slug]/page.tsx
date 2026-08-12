import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag as TagIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeBlogHtml } from "@/lib/sanitize-html";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

async function fetchPost(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("id, slug, title, excerpt, content_html, cover_image_url, cover_image_alt, published_at, tags, author_id, seo_title, seo_description, blog_categories(name, slug, color)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

async function fetchAuthor(id: string | null) {
  if (!id) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function fetchRelated(currentSlug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("id, slug, title, cover_image_url, published_at")
    .eq("status", "published")
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3);
  return data || [];
}

// Increment view count (fire-and-forget)
async function incrementViews(postId: string) {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("blog_posts")
    .select("view_count")
    .eq("id", postId)
    .single();
  if (current) {
    await admin
      .from("blog_posts")
      .update({ view_count: (current.view_count || 0) + 1 })
      .eq("id", postId);
  }
}

export async function generateMetadata(props: { params: Params }) {
  const { slug } = await props.params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: (post.seo_title || post.title) + " — Xobriq Blog",
    description: post.seo_description || post.excerpt || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.cover_image_url ? [post.cover_image_url] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage(props: { params: Params }) {
  const { slug } = await props.params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const [author, related] = await Promise.all([
    fetchAuthor(post.author_id),
    fetchRelated(slug),
  ]);

  // Fire-and-forget view increment
  incrementViews(post.id).catch(() => {});

  const category = (post as any).blog_categories as
    | { name: string; slug: string; color: string }
    | null;

  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <article className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:py-24">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-enterprise-fg-muted hover:text-enterprise-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All posts
        </Link>

        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs">
          {category ? (
            <span className="label-caps-thin text-enterprise-accent">
              {category.name}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-enterprise-fg-subtle">
            <Calendar className="h-3 w-3" />
            {new Date(post.published_at).toLocaleDateString("en-KE", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {post.title}
        </h1>

        {post.excerpt ? (
          <p className="mt-6 text-lg text-enterprise-fg-muted sm:text-xl">
            {post.excerpt}
          </p>
        ) : null}

        {author ? (
          <div className="mt-10 flex items-center gap-3 border-t border-enterprise-border pt-6">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-enterprise-primary text-sm font-bold text-enterprise-on-primary">
              {(author.full_name || author.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {author.full_name || author.email.split("@")[0]}
              </p>
              <p className="text-xs text-enterprise-fg-subtle">Xobriq Team</p>
            </div>
          </div>
        ) : null}

        {post.cover_image_url ? (
          <div className="relative mt-10 aspect-video overflow-hidden rounded-2xl">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
              priority
            />
          </div>
        ) : null}

        <div
          className="prose dark:prose-invert mt-12 max-w-none prose-headings:tracking-tight prose-a:text-enterprise-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content_html || "") }}
        />

        {post.tags && post.tags.length > 0 ? (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-enterprise-border pt-6">
            <TagIcon className="h-3.5 w-3.5 text-enterprise-fg-subtle" />
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-enterprise-border bg-enterprise-bg-low px-3 py-1 text-xs text-enterprise-fg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      {related.length > 0 ? (
        <section className="border-t border-enterprise-border bg-enterprise-bg-low py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Keep reading
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((p) => (
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
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold">{p.title}</h3>
                    <span className="mt-3 text-xs text-enterprise-fg-subtle">
                      {new Date(p.published_at).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
