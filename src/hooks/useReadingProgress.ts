import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      userBookId,
      bookId,
      currentPage,
      totalPages,
    }: {
      userBookId: string;
      bookId: string;
      currentPage: number;
      totalPages: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
      const isFinished = progress === 100;

      // Update the user_books row
      const { error: updateError } = await supabase
        .from('user_books')
        .update({
          current_page: currentPage,
          progress,
          status: isFinished ? 'finished' : 'reading',
          finished_at: isFinished ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userBookId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log a reading session entry
      const { error: sessionError } = await supabase.from('reading_sessions').insert({
        user_id: user.id,
        book_id: bookId,
        pages_read: currentPage,
        session_date: new Date().toISOString().split('T')[0],
      });

      if (sessionError) throw sessionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
    },
  });
}

export function useReadingStreak(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['reading-streak', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_reading_streak', { p_user_id: userId });
      if (error) throw error;
      return data as number;
    },
    enabled: !!userId,
  });
}