import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  entity_id: string | null;
  entity_type: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications on mount
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles(id, display_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
      setIsLoading(false);
    };

    fetchNotifications();
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Prepend new notification to state
          setNotifications((prev) => [newNotification, ...prev]);
          // Increment unread count if not already read
          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    markAllRead,
    isLoading,
  };
}