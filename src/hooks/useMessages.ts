import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  book_id: string | null;
  created_at: string;
  sender: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Conversation {
  id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const user = useAuthStore((state) => state.user);

  // Fetch initial messages
  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, display_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Set messages when data changes
  useEffect(() => {
    if (query.data) {
      setMessages(query.data);
    }
  }, [query.data]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only append if not already in the list (to avoid duplicates on own messages)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            
            // Fetch full message with sender profile
            supabase
              .from('messages')
              .select('*, sender:profiles(id, display_name, avatar_url)')
              .eq('id', newMessage.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setMessages((current) => [...current, data as Message]);
                }
              });
            
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    messages,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      bookId,
    }: {
      conversationId: string;
      content: string;
      bookId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (!content.trim()) throw new Error('Message content is required');

      // Insert the message
      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        book_id: bookId || null,
      });

      if (messageError) throw messageError;

      // Update conversation_participants last_read_at
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useConversations = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];

      // Get all conversations where the current user is a participant
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (participantsError) throw participantsError;
      if (!participants || participants.length === 0) return [];

      const conversationIds = participants.map((p) => p.conversation_id);

      // Get all conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, created_at, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;
      if (!conversations) return [];

      // Get other participants and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          // Get other participant
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)
            .single();

          let otherUser = null;
          if (otherParticipant) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, username')
              .eq('id', otherParticipant.user_id)
              .single();
            otherUser = profile;
          }

          // Get unread count
          const participant = participants.find((p) => p.conversation_id === conv.id);
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', participant?.last_read_at || '1970-01-01');

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: conv.id,
            last_message: lastMessage?.content || 'No messages yet',
            last_message_at: lastMessage?.created_at || conv.updated_at,
            unread_count: unreadCount || 0,
            other_user: otherUser,
          } as Conversation;
        })
      );

      return conversationsWithDetails;
    },
    enabled: !!user,
  });
};