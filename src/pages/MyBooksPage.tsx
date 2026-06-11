import { useState } from "react";
import { BookOpen, Target, BarChart3, Calendar, Plus, Share2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { BookCard } from "@/components/BookCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBooks } from "@/hooks/useBooks";
import type { Book } from "@/lib/mock-data";

const shelfConfig = [
  { label: "Currently Reading", status: "reading" as const },
  { label: "TBR", status: "tbr" as const },
  { label: "Finished", status: "finished" as const },
  { label: "Wishlist", status: "wishlist" as const },
  { label: "DNF", status: "dnf" as const },
];

const genreData = [
  { name: "Fantasy", pct: 35, color: "bg-accent" },
  { name: "Romance", pct: 25, color: "bg-burgundy" },
  { name: "Sci-Fi", pct: 20, color: "bg-primary" },
  { name: "Thriller", pct: 12, color: "bg-muted-foreground" },
  { name: "Other", pct: 8, color: "bg-muted" },
];

function mapToBookCard(userBook: any): Book {
  return {
    id: userBook.book?.id ?? userBook.id,
    title: userBook.book?.title ?? "Unknown",
    author: userBook.book?.author ?? "Unknown",
    cover: userBook.book?.cover_url ?? "",
    rating: userBook.book?.rating_avg ?? userBook.rating ?? 0,
    genre: userBook.book?.genre ?? "",
    progress: userBook.progress ?? 0,
    pages: userBook.book?.pages ?? 0,
    mood: userBook.book?.mood ?? undefined,
  };
}

function ShelfSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-none md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible md:mx-0 md:px-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="snap-start shrink-0 md:shrink flex flex-col gap-2">
          <Skeleton className="w-32 md:w-36 aspect-[2/3] rounded-t-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

const MyBooksPage = () => {
  const { data: allBooks, isLoading } = useMyBooks();

  const stats = [
    { label: "Books Read", value: String(allBooks?.filter((b) => b.status === "finished").length ?? 0), icon: BookOpen },
    { label: "Pages", value: "12,480", icon: BarChart3 },
    { label: "Avg Rating", value: "4.2", icon: Target },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">My Books</h1>
          <div className="flex gap-2">
            <Button className="gold-gradient text-accent-foreground border-0 hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" /> Add Book
            </Button>
            <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 md:p-5 flex flex-col items-center justify-center space-y-2 col-span-2 md:col-span-1">
            <ProgressRing progress={60} size={80} strokeWidth={6} label="12" />
            <p className="text-xs text-muted-foreground text-center">of 20 books in 2026</p>
          </div>
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <stat.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shelves */}
        {shelfConfig.map((shelf, si) => {
          const shelfBooks = allBooks?.filter((b) => b.status === shelf.status) ?? [];
          return (
            <section key={shelf.status} aria-labelledby={`shelf-${si}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 id={`shelf-${si}`} className="font-heading text-lg font-bold text-foreground">
                  {shelf.label}{" "}
                  <span className="text-muted-foreground font-normal text-sm">({shelfBooks.length})</span>
                </h2>
                {shelfBooks.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-accent text-xs">View All</Button>
                )}
              </div>

              {isLoading ? (
                <ShelfSkeleton />
              ) : shelfBooks.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No books in {shelf.label.toLowerCase()} yet.
                  </p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-none md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible md:mx-0 md:px-0">
                  {shelfBooks.map((userBook) => (
                    <div key={userBook.id} className="snap-start shrink-0 md:shrink">
                      <BookCard book={mapToBookCard(userBook)} showProgress size="md" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* Genre Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-heading text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Genre Breakdown
            </h3>
            <div className="space-y-3">
              {genreData.map((g) => (
                <div key={g.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{g.name}</span>
                    <span className="text-muted-foreground">{g.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${g.color} transition-all duration-500`} style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="font-heading text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Reading Calendar
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground font-medium pb-1">{d}</div>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const hasReading = [0, 1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 25, 26].includes(i);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm flex items-center justify-center text-[10px] ${
                      hasReading ? "gold-gradient text-accent-foreground font-medium" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">20 / 28 days active this month</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MyBooksPage;
