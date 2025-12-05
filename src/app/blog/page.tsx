import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/blog';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import BlogFooter from '@/components/footer/blog-footer';

export const metadata = {
  title: 'Blog | Budgez',
  description: 'Guide, consigli e strategie per freelancer e agenzie su preventivi, pricing e gestione clienti.',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const allTags = getAllTags();
  const featuredPost = posts.find((post) => post.featured);
  const regularPosts = posts.filter((post) => !post.featured || post !== featuredPost);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              B) Budgez
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                App
              </Link>
              <Link href="/blog" className="text-sm font-medium">
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Guide pratiche, strategie e consigli per freelancer e agenzie. 
            Impara a creare preventivi efficaci e a gestire meglio i tuoi clienti.
          </p>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Featured Post */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="block group mb-16">
            <article className="relative border border-border rounded-2xl p-8 md:p-12 hover:border-foreground/20 transition-all duration-300 bg-card">
              <div className="absolute top-6 right-6">
                <span className="px-3 py-1 text-xs font-medium bg-foreground text-background rounded-full">
                  In evidenza
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(featuredPost.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {featuredPost.readingTime}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline underline-offset-4">
                {featuredPost.title}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                {featuredPost.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                Leggi l'articolo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          </Link>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regularPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="h-full border border-border rounded-xl p-6 hover:border-foreground/20 transition-all duration-300 bg-card">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTime}
                  </span>
                </div>
                <h2 className="text-lg font-semibold mb-2 group-hover:underline underline-offset-4">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              Nessun articolo disponibile al momento.
            </p>
            <Link href="/" className="text-sm font-medium underline underline-offset-4">
              Torna alla home
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <BlogFooter />
    </div>
  );
}

