import { Heart, MessageCircle, Share2, Star, Bookmark } from "lucide-react";
import type { Post } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="book-card p-4 md:p-5 space-y-3" aria-label={`Post by ${post.user.name}`}>
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-accent/30">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {post.user.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{post.user.name}</p>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Bookmark post">
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      {post.type === "quote" ? (
        <blockquote className="border-l-3 border-accent pl-4 py-2 font-heading italic text-sm md:text-base text-foreground/90">
          {post.content}
        </blockquote>
      ) : (
        <p className="text-sm md:text-[15px] leading-relaxed text-foreground/90">{post.content}</p>
      )}

      {post.rating && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < post.rating! ? "fill-accent text-accent" : "text-muted"}`}
            />
          ))}
        </div>
      )}

      {post.book && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
          <img
            src={post.book.cover}
            alt={`Cover of ${post.book.title}`}
            className="h-14 w-10 rounded object-cover"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold truncate">{post.book.title}</p>
            <p className="text-xs text-muted-foreground">{post.book.author}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 pt-1">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-destructive">
          <Heart className="h-4 w-4" />
          <span className="text-xs">{post.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{post.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground ml-auto">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
