import { useState } from "react";
import { Heart, MessageCircle, Share2, Star, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BookCover } from "@/components/shared/BookCover";
import {
  useToggleLike,
  useComments,
  useAddComment,
  useToggleBookmark,
  type Post,
} from "@/hooks/usePosts";

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PostCard({ post }: { post: Post }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const likeMutation = useToggleLike(post.id);
  const bookmarkMutation = useToggleBookmark(post.id);
  const addCommentMutation = useAddComment();
  const { data: comments, isLoading: commentsLoading } = useComments(
    commentOpen ? post.id : ""
  );

  const displayUser = post.user;
  const userName = displayUser?.display_name ?? displayUser?.username ?? "Unknown";
  const userInitials = getInitials(
    displayUser?.display_name ?? null,
    displayUser?.username ?? ""
  );
  const userAvatar = displayUser?.avatar_url;

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    bookmarkMutation.mutate();
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(
      { postId: post.id, content: trimmed },
      {
        onSuccess: () => {
          setCommentText("");
        },
      }
    );
  };

  const isLiked = likeMutation.isPending;
  const isBookmarked = bookmarkMutation.isPending;

  return (
    <article
      className="book-card p-4 md:p-5 space-y-3"
      aria-label={`Post by ${userName}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-accent/30">
          {userAvatar ? (
            <AvatarImage src={userAvatar} alt={userName} />
          ) : null}
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {displayUser?.display_name ?? displayUser?.username ?? "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(post.created_at)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleBookmark}
          disabled={bookmarkMutation.isPending}
          aria-label="Bookmark post"
        >
          <Bookmark
            className={`h-4 w-4 ${isBookmarked ? "fill-accent text-accent" : ""}`}
          />
        </Button>
      </div>

      {post.type === "quote" ? (
        <blockquote className="border-l-[3px] border-accent pl-4 py-2 font-heading italic text-sm md:text-base text-foreground/90">
          {post.content}
        </blockquote>
      ) : (
        <p className="text-sm md:text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {post.rating && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < post.rating!
                  ? "fill-accent text-accent"
                  : "text-muted"
              }`}
            />
          ))}
        </div>
      )}

      {post.book && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
          <BookCover
            src={post.book.cover_url ?? undefined}
            alt={post.book.title}
            className="h-14 w-10 rounded object-cover"
          />
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold truncate">
              {post.book.title}
            </p>
            <p className="text-xs text-muted-foreground">{post.book.author}</p>
          </div>
        </div>
      )}

      <Collapsible open={commentOpen} onOpenChange={setCommentOpen}>
        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isLiked ? "fill-accent text-accent" : ""
              }`}
            />
            <span className="text-xs">{post.likes_count}</span>
          </Button>

          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{post.comments_count}</span>
            </Button>
          </CollapsibleTrigger>

          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground ml-auto">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <CollapsibleContent className="pt-3 space-y-3">
          {/* Comment list */}
          {commentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    {comment.user?.avatar_url ? (
                      <AvatarImage src={comment.user.avatar_url} />
                    ) : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
                      {getInitials(
                        comment.user?.display_name ?? null,
                        ""
                      ) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 bg-secondary/40 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">
                      {comment.user?.display_name ?? "Reader"}
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              No comments yet. Be the first!
            </p>
          )}

          {/* Comment input */}
          <div className="flex gap-2 items-start">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button
              size="sm"
              className="mt-0.5 shrink-0 gold-gradient"
              onClick={handleAddComment}
              disabled={
                !commentText.trim() || addCommentMutation.isPending
              }
            >
              Post
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}