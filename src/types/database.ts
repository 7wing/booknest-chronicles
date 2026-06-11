// TODO: Replace with full generated types once Supabase schema is created.
// Run this command in the project root after completing SUPABASE_STEPS.md:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// Then delete this TODO comment and replace this entire file with the generated output.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      books: {
        Row: {
          id: string;
          google_books_id: string | null;
          title: string;
          authors: string[];
          description: string | null;
          cover_url: string | null;
          page_count: number | null;
          published_date: string | null;
          isbn: string | null;
          categories: string[];
          search_vector: unknown;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['books']['Row'], 'id' | 'created_at' | 'search_vector'>;
        Update: Partial<Database['public']['Tables']['books']['Insert']>;
      };
      user_books: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          status: 'currently_reading' | 'want_to_read' | 'finished' | 'wishlist' | 'dnf';
          progress: number;
          current_page: number;
          rating: number | null;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_books']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_books']['Insert']>;
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          book_id: string | null;
          content: string;
          post_type: 'review' | 'quote' | 'update' | 'poll' | 'general';
          rating: number | null;
          contains_spoilers: boolean;
          image_urls: string[];
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      post_likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_likes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['post_likes']['Insert']>;
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['post_comments']['Insert']>;
      };
      post_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_bookmarks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['post_bookmarks']['Insert']>;
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['follows']['Insert']>;
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          current_book_id: string | null;
          owner_id: string;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clubs']['Row'], 'id' | 'created_at' | 'updated_at' | 'member_count'>;
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>;
      };
      club_members: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['club_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['club_members']['Insert']>;
      };
      club_discussions: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          title: string;
          content: string;
          replies_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['club_discussions']['Row'], 'id' | 'created_at' | 'updated_at' | 'replies_count'>;
        Update: Partial<Database['public']['Tables']['club_discussions']['Insert']>;
      };
      live_sessions: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          scheduled_at: string;
          started_at: string | null;
          ended_at: string | null;
          owner_id: string;
          viewer_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['live_sessions']['Row'], 'id' | 'created_at' | 'viewer_count'>;
        Update: Partial<Database['public']['Tables']['live_sessions']['Insert']>;
      };
      live_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['live_chat_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['live_chat_messages']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversation_participants']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['conversation_participants']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          image_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          type: string;
          reference_id: string | null;
          reference_type: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      reading_sessions: {
        Row: {
          id: string;
          user_id: string;
          user_book_id: string;
          pages_read: number;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reading_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reading_sessions']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}