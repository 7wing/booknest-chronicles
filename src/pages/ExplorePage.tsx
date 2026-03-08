import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { BookCard } from "@/components/BookCard";
import { LiveCard } from "@/components/LiveCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { books, liveSessions, genres, moods, clubs } from "@/lib/mock-data";

const ExplorePage = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 space-y-8">
        {/* Search */}
        <div className="space-y-4">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Discover</h1>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search books, authors, clubs, live sessions..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Search"
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Filters">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Genre Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {genres.map((genre, i) => (
              <Badge
                key={genre}
                className={`shrink-0 cursor-pointer transition-colors ${
                  i === 0
                    ? "bg-accent text-accent-foreground border-0"
                    : "bg-secondary text-secondary-foreground border-0 hover:bg-accent/15"
                }`}
              >
                {genre}
              </Badge>
            ))}
          </div>

          {/* Mood Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {moods.map((mood) => (
              <Badge
                key={mood}
                variant="outline"
                className="shrink-0 cursor-pointer hover:bg-secondary"
              >
                {mood}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sponsored Carousel */}
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="font-heading text-lg font-bold text-foreground mb-3">Featured</h2>
          <div className="navy-gradient rounded-2xl p-5 md:p-8 flex flex-col md:flex-row items-center gap-5">
            <img src={books[3].cover} alt="" className="h-40 w-28 rounded-lg object-cover shadow-xl" />
            <div className="text-center md:text-left">
              <Badge className="bg-accent/20 text-accent border-0 mb-2">Editor's Pick</Badge>
              <h3 className="font-heading text-xl font-bold text-primary-foreground">{books[3].title}</h3>
              <p className="text-sm text-primary-foreground/70 mt-1">by {books[3].author}</p>
              <p className="text-sm text-primary-foreground/80 mt-2 max-w-md">
                An astronaut wakes up alone on a spaceship with no memory. The fate of humanity rests on his shoulders.
              </p>
              <Button className="mt-4 gold-gradient text-accent-foreground border-0 hover:opacity-90">
                Add to Shelf
              </Button>
            </div>
          </div>
        </section>

        {/* Live Previews */}
        <section aria-labelledby="explore-live">
          <h2 id="explore-live" className="font-heading text-lg font-bold text-foreground mb-3">Live & Upcoming</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-none">
            {liveSessions.map((s) => (
              <div key={s.id} className="snap-start"><LiveCard session={s} /></div>
            ))}
          </div>
        </section>

        {/* Book Grid */}
        <section aria-labelledby="all-books">
          <h2 id="all-books" className="font-heading text-lg font-bold text-foreground mb-3">Popular Books</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {books.map((book, i) => (
              <div key={book.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <BookCard book={book} size="lg" />
              </div>
            ))}
          </div>
        </section>

        {/* Clubs */}
        <section aria-labelledby="explore-clubs">
          <h2 id="explore-clubs" className="font-heading text-lg font-bold text-foreground mb-3">Active Clubs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => (
              <div key={club.id} className="book-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={club.currentBook.cover} alt="" className="h-14 w-10 rounded object-cover" />
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm font-bold truncate">{club.name}</h3>
                    <p className="text-xs text-muted-foreground">{club.members.toLocaleString()} members</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{club.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-foreground">Reading: <span className="font-semibold">{club.currentBook.title}</span></p>
                  <Button size="sm" variant="outline" className="h-7 text-xs">Join</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default ExplorePage;
