import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { addBookToDatabase, searchGoogleBooks } from '@/services/books';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  pages: number | null;
  genre: string | null;
  description: string | null;
  google_books_id?: string | null;
}

export interface UserBook {
  id: string;
  status: string;
  progress: number;
  current_page: number;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  is_private: boolean;
  created_at: string;
  book: Book;
}

// ---------------------------------------------------------------------------
// useMyBooks
// ---------------------------------------------------------------------------

export function useMyBooks(status?: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['my-books', user?.id, status],
    queryFn: async (): Promise<UserBook[]> => {
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('user_books')
        .select('*, book:books(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as unknown as UserBook[]) ?? [];
    },
    enabled: !!user,
  });
}

// ---------------------------------------------------------------------------
// useBook
// ---------------------------------------------------------------------------

export function useBook(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: async (): Promise<Book | null> => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Book | null;
    },
  });
}

// ---------------------------------------------------------------------------
// useAddToShelf
// ---------------------------------------------------------------------------

export function useAddToShelf() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ bookId, status }: { bookId: string; status: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_books')
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            status,
          },
          { onConflict: 'user_id, book_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateShelfEntry
// ---------------------------------------------------------------------------

export interface UpdateShelfEntryInput {
  id: string;
  status?: string;
  progress?: number;
  current_page?: number;
  rating?: number | null;
  notes?: string | null;
  is_private?: boolean;
  started_at?: string | null;
  finished_at?: string | null;
}

export function useUpdateShelfEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateShelfEntryInput) => {
      const { id, ...fields } = input;

      const { error } = await supabase
        .from('user_books')
        .update(fields)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
    },
  });
}

// ---------------------------------------------------------------------------
// useBookSearch
// ---------------------------------------------------------------------------

export function useBookSearch(query: string) {
  const [debouncedQuery] = useDebounce(query, 300);

  return useQuery({
    queryKey: ['book-search', debouncedQuery],
    queryFn: async (): Promise<Book[]> => {
      // Try local full-text search first
      const { data: localData, error: localError } = await supabase.rpc(
        'search_books',
        { query: debouncedQuery }
      );

      if (!localError && Array.isArray(localData) && localData.length > 0) {
        return localData as unknown as Book[];
      }

      // Fall back to Google Books API
      const googleResults = await searchGoogleBooks(debouncedQuery);

      // Upsert each result into the local books table and return enriched data
      const books: Book[] = await Promise.all(
        googleResults.map(async (result) => {
          const bookData = {
            google_books_id: result.google_books_id,
            title: result.title,
            author: result.author,
            cover_url: result.cover_url,
            pages: result.pages,
            genre: result.genre,
            description: result.description,
          };

          const savedBook = await addBookToDatabase(bookData);
          return savedBook;
        })
      );

      return books;
    },
    enabled: debouncedQuery.length > 1,
  });
}