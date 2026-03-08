import { AppLayout } from "@/components/AppLayout";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { books, posts, clubs } from "@/lib/mock-data";
import { Star, BookOpen, Users, MessageCircle, Radio, Plus, Heart, Share2, AlertTriangle } from "lucide-react";

const BookDetailPage = () => {
  const book = books[0];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-5 md:py-6 space-y-8">
        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0 mx-auto md:mx-0">
            <img
              src={book.cover}
              alt={`Cover of ${book.title}`}
              className="w-40 md:w-52 rounded-xl shadow-xl object-cover aspect-[2/3]"
            />
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <Badge className="bg-accent/15 text-accent border-0 mb-2">{book.genre}</Badge>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{book.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">by {book.author}</p>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(book.rating) ? "fill-accent text-accent" : "text-muted"}`} />
                ))}
                <span className="ml-1.5 text-sm font-semibold">{book.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">{book.pages} pages</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge variant="outline">{book.mood}</Badge>
              <Badge variant="outline">Adult</Badge>
              <Badge variant="outline">Standalone</Badge>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button className="gold-gradient text-accent-foreground border-0 gap-2 hover:opacity-90">
                <Plus className="h-4 w-4" /> Add to Shelf
              </Button>
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" /> Start Reading
              </Button>
              <Button variant="outline" className="gap-2">
                <Radio className="h-4 w-4" /> Join Read-Along
              </Button>
            </div>
            <div className="flex gap-3 justify-center md:justify-start">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"><Heart className="h-4 w-4" /> Wishlist</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"><Share2 className="h-4 w-4" /> Share</Button>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        {book.progress && (
          <div className="glass-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Your Progress</span>
              <span className="text-muted-foreground">{book.progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full gold-gradient rounded-full transition-all" style={{ width: `${book.progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Page {Math.round(book.pages * book.progress / 100)} of {book.pages}</p>
          </div>
        )}

        {/* Synopsis */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-3">Synopsis</h2>
          <p className="text-sm leading-relaxed text-foreground/85">
            Between life and death there is a library, and within that library, the shelves go on forever.
            Every book provides a chance to try another life you could have lived. To see how things would be
            if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?
            A dazzling novel about all the choices that go into a life well lived.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <p className="text-xs text-muted-foreground">Content warnings: Mental health themes, existential crisis</p>
          </div>
        </section>

        {/* Reviews & Discussions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h2 className="font-heading text-xl font-bold mb-3 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" /> Reviews
            </h2>
            <div className="space-y-4">
              {posts.filter(p => p.book?.id === book.id).map((post) => (
                <div key={post.id} className="book-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-secondary text-[10px]">{post.user.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{post.user.name}</span>
                    {post.rating && (
                      <div className="flex ml-auto">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < post.rating! ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground/85">{post.content}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> Clubs Reading This
            </h2>
            <div className="space-y-3">
              {clubs.filter(c => c.currentBook.id === book.id).map((club) => (
                <div key={club.id} className="book-card p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{club.name}</h3>
                    <p className="text-xs text-muted-foreground">{club.members.toLocaleString()} members</p>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
              ))}
            </div>

            <h3 className="font-heading text-lg font-bold mt-6 mb-3">You Might Also Like</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {books.slice(1, 5).map((b) => (
                <div key={b.id} className="shrink-0"><BookCard book={b} size="sm" /></div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default BookDetailPage;
