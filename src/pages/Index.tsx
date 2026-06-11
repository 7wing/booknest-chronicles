import { Search, TrendingUp, Flame, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/shared/BookCover";
import { PostCard } from "@/components/PostCard";
import { LiveCard } from "@/components/LiveCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { books, posts, liveSessions } from "@/lib/mock-data";

const Index = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 space-y-8">
        {/* Search + Stats Row */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search books, authors, clubs..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2.5 flex items-center gap-3">
              <ProgressRing progress={60} size={44} strokeWidth={4} label="12" sublabel="" />
              <div>
                <p className="text-xs font-semibold text-foreground">12 / 20</p>
                <p className="text-[10px] text-muted-foreground">2026 Goal</p>
              </div>
            </div>
            <div className="glass-card px-4 py-2.5 flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs font-semibold text-foreground">12 days</p>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Read-Alongs */}
        <section aria-labelledby="live-heading">
          <div className="flex items-center gap-2 mb-4">
            <h2 id="live-heading" className="font-heading text-xl md:text-2xl font-bold text-foreground">Live Now</h2>
            <span className="live-badge">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
              2 LIVE
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
            {liveSessions.filter(s => s.isLive).map((session, i) => (
              <div key={session.id} className="snap-start" style={{ animationDelay: `${i * 100}ms` }}>
                <LiveCard session={session} />
              </div>
            ))}
          </div>
        </section>

        {/* Currently Reading */}
        <section aria-labelledby="reading-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="reading-heading" className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Currently Reading
            </h2>
            <Button variant="ghost" size="sm" className="text-accent text-xs">See All</Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible md:mx-0 md:px-0">
            {books.filter(b => b.progress && b.progress < 100).map((book) => (
              <div key={book.id} className="snap-start shrink-0 md:shrink">
                <BookCard book={book} showProgress size="md" />
              </div>
            ))}
          </div>
        </section>

        {/* Feed + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <section className="lg:col-span-2 space-y-4" aria-labelledby="feed-heading">
            <div className="flex items-center gap-3 mb-2">
              <h2 id="feed-heading" className="font-heading text-xl md:text-2xl font-bold text-foreground">Your Feed</h2>
              <div className="flex gap-2">
                <Badge className="bg-accent/15 text-accent border-0 cursor-pointer hover:bg-accent/25">Following</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">For You</Badge>
              </div>
            </div>
            {posts.map((post, i) => (
              <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
          </section>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-5" aria-label="Sidebar">
            {/* Challenges */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-heading text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Spring Challenge
              </h3>
              <p className="text-xs text-muted-foreground">Read 5 books this season. 3 days left!</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full gold-gradient rounded-full" style={{ width: "80%" }} />
              </div>
              <p className="text-xs text-muted-foreground">4/5 completed</p>
              <Button size="sm" className="w-full gold-gradient text-accent-foreground border-0 hover:opacity-90">
                View Challenge
              </Button>
            </div>

            {/* Trending Books */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-heading text-base font-bold">Trending This Week</h3>
              <div className="space-y-3">
                {books.slice(3).map((book, i) => (
                  <div key={book.id} className="flex items-center gap-3">
                    <span className="text-lg font-heading font-bold text-accent/60">{i + 1}</span>
                    <BookCover src={book.cover} alt={book.title} className="h-12 w-8 rounded object-cover" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsored */}
            <div className="glass-card p-4 space-y-2 border-accent/20">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sponsored</p>
              <div className="flex items-center gap-3">
                <BookCover src={books[1].cover} alt={books[1].title} className="h-16 w-11 rounded object-cover" />
                <div>
                  <p className="text-sm font-semibold">New from Penguin</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Discover the season's most anticipated releases</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-accent">Shop Now →</Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
