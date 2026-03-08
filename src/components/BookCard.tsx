import { Star, BookOpen } from "lucide-react";
import type { Book } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: Book;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function BookCard({ book, showProgress = false, size = "md", onClick }: BookCardProps) {
  const sizes = {
    sm: "w-24 md:w-28",
    md: "w-32 md:w-36",
    lg: "w-40 md:w-48",
  };

  return (
    <button
      onClick={onClick}
      className="book-card group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className={`${sizes[size]} flex flex-col`}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl">
          <img
            src={book.cover}
            alt={`Cover of ${book.title} by ${book.author}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {book.mood && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] border-0">
              {book.mood}
            </Badge>
          )}
          {showProgress && book.progress !== undefined && book.progress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div
                className="h-full gold-gradient transition-all duration-500"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="p-2 space-y-0.5">
          <h3 className="font-heading text-xs md:text-sm font-semibold leading-tight line-clamp-2 text-card-foreground">
            {book.title}
          </h3>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{book.author}</p>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-[10px] text-muted-foreground">{book.rating}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
