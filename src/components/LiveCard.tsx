import { Users, Play } from "lucide-react";
import type { LiveSession } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/shared/BookCover";

interface LiveCardProps {
  session: LiveSession;
}

export function LiveCard({ session }: LiveCardProps) {
  return (
    <article className="book-card group overflow-hidden min-w-[260px] md:min-w-[300px]" aria-label={`${session.isLive ? "Live" : "Upcoming"}: ${session.title}`}>
      <div className="relative aspect-video overflow-hidden">
        <img
          src={session.thumbnail}
          alt={`Thumbnail for ${session.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        {session.isLive && (
          <span className="live-badge absolute top-3 left-3">
            <span className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
            LIVE
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="font-heading text-sm font-bold text-primary-foreground drop-shadow-md">
              {session.title}
            </h3>
            <p className="text-xs text-primary-foreground/80">{session.host}</p>
          </div>
          <div className="flex items-center gap-1 text-primary-foreground/90">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{session.viewers}</span>
          </div>
        </div>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <BookCover src={session.book.cover} alt={session.book.title} className="h-8 w-6 rounded object-cover" />
          <span className="text-xs text-muted-foreground truncate">{session.book.title}</span>
        </div>
        <Button size="sm" className="h-8 gap-1.5 gold-gradient text-accent-foreground border-0 hover:opacity-90">
          <Play className="h-3 w-3" />
          Join
        </Button>
      </div>
    </article>
  );
}
