import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface LiveChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useLiveChat(sessionId: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch existing messages
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['live-chat', sessionId],
    queryFn: async (): Promise<LiveChatMessage[]> => {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*, user:profiles(id, display_name, avatar_url)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        console.error('Error fetching live chat messages:', error);
        return [];
      }

      return (data as LiveChatMessage[]) ?? [];
    },
    enabled: !!sessionId,
  });

  // Initialize messages from query
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('live_chat_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        content,
      });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
  });

  // sendMessage function
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      if (!user) {
        console.warn('Must be logged in to send messages');
        return;
      }
      sendMessageMutation.mutate(content.trim());
    },
    [user, sendMessageMutation]
  );

  // Realtime subscription for messages
  useEffect(() => {
    if (!sessionId) return;

    const chatChannel = supabase
      .channel(`live-chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the full message with user profile
          const { data } = await supabase
            .from('live_chat_messages')
            .select('*, user:profiles(id, display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Avoid duplicates and keep last 200 messages
              const filtered = prev.filter((m) => m.id !== data.id);
              const updated = [...filtered, data as LiveChatMessage];
              return updated.slice(-200);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [sessionId]);

  // Presence subscription for viewer count
  useEffect(() => {
    if (!sessionId) return;

    const presenceChannel = supabase.channel(`live:${sessionId}`, {
      config: { presence: { key: user?.id ?? 'anon' } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user?.id ?? 'anon',
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [sessionId, user?.id]);

  return {
    messages,
    viewerCount,
    isLoading,
    isConnected,
    sendMessage,
    isSending: sendMessageMutation.isPending,
  };
}