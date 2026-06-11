import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useToggleLike } from "@/hooks/usePosts";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
}

export function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const { user } = useAuthStore();
  const toggleLike = useToggleLike(postId);

  const { data: hasLiked } = useQuery({
    queryKey: ["like", user?.id, postId],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-1.5 ${hasLiked ? "text-destructive" : "text-muted-foreground"}`}
      onClick={() => toggleLike.mutate()}
      disabled={toggleLike.isPending}
    >
      <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
      <span className="text-xs">{initialCount}</span>
    </Button>
  );
}
