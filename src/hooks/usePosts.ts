import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  user_id: string;
  book_id: string | null;
  type: string;
  content: string;
  rating: number | null;
  contains_spoilers: boolean;
  image_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  is_private: boolean;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
  } | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ─── useFeed ─────────────────────────────────────────────────────────────────

export function useFeed(tab?: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['posts', tab],
    queryFn: async (): Promise<Post[]> => {
      // If "Following" tab and user is logged in, filter by followed users
      if (tab === 'Following' && user) {
        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followsError) throw followsError;

        const followedIds = (followsData ?? []).map((f) => f.following_id);

        if (followedIds.length === 0) return [];

        const { data, error } = await supabase
          .from('posts')
          .select(
            `*, user:profiles(id, username, display_name, avatar_url), book:books(id, title, author, cover_url)`
          )
          .in('user_id', followedIds)
          .eq('is_private', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return (data as unknown as Post[]) ?? [];
      }

      // "For You" or no tab — fetch all public posts
      const { data, error } = await supabase
        .from('posts')
        .select(
          `*, user:profiles(id, username, display_name, avatar_url), book:books(id, title, author, cover_url)`
        )
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data as unknown as Post[]) ?? [];
    },
    enabled: tab !== 'Following' || !!user,
  });
}

// ─── useCreatePost ───────────────────────────────────────────────────────────

interface CreatePostInput {
  content: string;
  type: string;
  rating?: number;
  bookId?: string;
  contains_spoilers?: boolean;
  image_urls?: string[];
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: input.content,
          type: input.type,
          rating: input.rating ?? null,
          book_id: input.bookId ?? null,
          contains_spoilers: input.contains_spoilers ?? false,
          image_urls: input.image_urls ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── useToggleLike ───────────────────────────────────────────────────────────

export function useToggleLike(postId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Check current like status
      const { data: existing, error: fetchError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: user.id,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', user?.id, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── useComments ─────────────────────────────────────────────────────────────

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`*, user:profiles(id, display_name, avatar_url)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Comment[]) ?? [];
    },
  });
}

// ─── useAddComment ───────────────────────────────────────────────────────────

interface AddCommentInput {
  postId: string;
  content: string;
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: AddCommentInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: input.postId,
          user_id: user.id,
          content: input.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── useToggleBookmark ───────────────────────────────────────────────────────

export function useToggleBookmark(postId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing, error: fetchError } = await supabase
        .from('post_bookmarks')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error } = await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_bookmarks').insert({
          post_id: postId,
          user_id: user.id,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', user?.id, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}