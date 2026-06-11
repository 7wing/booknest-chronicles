import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  header_url: string | null;
  reading_goal: number;
  streak_days: number;
  last_read_at: string | null;
  is_public: boolean;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

// ─── useProfile ─────────────────────────────────────────────────────────────

export function useProfile(userId?: string) {
  const { user } = useAuthStore();
  const targetId = userId ?? user?.id;

  return useQuery({
    queryKey: ['profile', targetId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!(targetId),
  });
}

// ─── useUpdateProfile ───────────────────────────────────────────────────────

export function useUpdateProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

// ─── useIsFollowing ─────────────────────────────────────────────────────────

export function useIsFollowing(targetUserId: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['follow', user?.id, targetUserId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user!.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!(user && targetUserId && user.id !== targetUserId),
  });
}

// ─── useToggleFollow ────────────────────────────────────────────────────────

export function useToggleFollow(targetUserId: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Check current follow state
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user!.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (existing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user!.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        return false;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user!.id, following_id: targetUserId });

        if (error) throw error;
        return true;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', user?.id, targetUserId] });
    },
  });
}