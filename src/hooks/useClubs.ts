import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  creator_id: string;
  is_public: boolean;
  member_count: number;
  current_book_id: string | null;
  created_at: string;
  updated_at: string;
  current_book?: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
  } | null;
}

export interface ClubMember {
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ClubDiscussion {
  id: string;
  club_id: string;
  user_id: string;
  title: string | null;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select(
          '*, current_book:books(id, title, author, cover_url)'
        )
        .eq('is_public', true)
        .order('member_count', { ascending: false });

      if (error) throw error;
      return (data as unknown as Club[]) ?? [];
    },
  });
};

export const useClub = (clubId: string) => {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select(
          '*, current_book:books(id, title, author, cover_url), members:club_members(user_id, role, joined_at, user:profiles(id, display_name, avatar_url))'
        )
        .eq('id', clubId)
        .single();

      if (error) throw error;
      return data as unknown as Club & { members: ClubMember[] };
    },
    enabled: !!clubId,
  });
};

export const useClubMembership = (clubId: string) => {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['club-member', user?.id, clubId],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!clubId,
  });
};

export const useJoinClub = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ clubId }: { clubId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert membership
      const { error: insertError } = await supabase.from('club_members').insert({
        club_id: clubId,
        user_id: user.id,
        role: 'member',
      });

      if (insertError) throw insertError;

      // Call RPC to increment member count
      const { error: rpcError } = await supabase.rpc('increment_club_members', {
        club_id: clubId,
      });

      if (rpcError) console.error('RPC error (non-fatal):', rpcError);
    },
    onSuccess: (_, variables) => {
      const userId = user?.id;
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club', variables.clubId] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['club-member', userId, variables.clubId] });
      }
    },
  });
};

export const useLeaveClub = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ clubId }: { clubId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const userId = user?.id;
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club', variables.clubId] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['club-member', userId, variables.clubId] });
      }
    },
  });
};

export const useClubDiscussions = (clubId: string) => {
  return useQuery({
    queryKey: ['club-discussions', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_discussions')
        .select('*, user:profiles(id, display_name, avatar_url)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as ClubDiscussion[]) ?? [];
    },
    enabled: !!clubId,
  });
};