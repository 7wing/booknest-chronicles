import { Button } from "@/components/ui/button";
import { useIsFollowing, useToggleFollow } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";

interface FollowButtonProps {
  targetUserId: string;
}

export function FollowButton({ targetUserId }: FollowButtonProps) {
  const { user } = useAuthStore();
  const { data: isFollowing } = useIsFollowing(targetUserId);
  const toggleFollow = useToggleFollow(targetUserId);

  if (!user || user.id === targetUserId) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={() => toggleFollow.mutate()}
      disabled={toggleFollow.isPending}
      className={isFollowing ? "" : "gold-gradient text-accent-foreground border-0"}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
