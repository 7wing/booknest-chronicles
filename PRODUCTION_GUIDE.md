# BookNest — Complete Production Build Guide

> A step-by-step technical blueprint for transforming the BookNest prototype into a fully functional, production-grade social reading platform — with real auth, database, file uploads, live features, and interactive UI.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Project Setup & Monorepo Structure](#3-project-setup--monorepo-structure)
4. [Database Design (Supabase / PostgreSQL)](#4-database-design-supabase--postgresql)
5. [Authentication & User Profiles](#5-authentication--user-profiles)
6. [File Uploads (Covers, Avatars, Thumbnails)](#6-file-uploads-covers-avatars-thumbnails)
7. [Making Every Button Functional](#7-making-every-button-functional)
8. [Real-Time Features (Live Sessions & Chat)](#8-real-time-features-live-sessions--chat)
9. [Search & Discovery](#9-search--discovery)
10. [Book Data — External APIs](#10-book-data--external-apis)
11. [Notifications](#11-notifications)
12. [Reading Progress Tracking](#12-reading-progress-tracking)
13. [Clubs & Community](#13-clubs--community)
14. [Responsive Design Hardening](#14-responsive-design-hardening)
15. [State Management](#15-state-management)
16. [API Layer (tRPC or REST)](#16-api-layer-trpc-or-rest)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment & CI/CD](#18-deployment--cicd)
19. [Environment Variables Checklist](#19-environment-variables-checklist)
20. [Migration Roadmap (Phase-by-Phase)](#20-migration-roadmap-phase-by-phase)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Client (React + Vite)              │
│  Pages · Components · React Query · Zustand store   │
└────────────────────┬────────────────────────────────┘
                     │  HTTPS / WebSocket
┌────────────────────▼────────────────────────────────┐
│              Supabase (BaaS)                         │
│  Auth · PostgreSQL · Storage · Realtime · Edge Fn   │
└─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           External Services                          │
│  Google Books API · OpenLibrary · Cloudinary (opt)  │
│  Resend (email) · Liveblocks (opt live collab)      │
└─────────────────────────────────────────────────────┘
```

**Why Supabase?** It provides Postgres, real-time subscriptions, Row-Level Security (RLS), Storage (S3-compatible), and Auth in one hosted service — eliminating the need for a separate backend server for most features.

---

## 2. Tech Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Already in place |
| Styling | Tailwind CSS + shadcn/ui | Already in place |
| Backend / DB | Supabase (PostgreSQL) | Auth + DB + Storage + Realtime in one |
| Server state | TanStack Query v5 | Already in place, pairs perfectly with Supabase |
| Client state | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Already in place |
| File uploads | Supabase Storage | Native, simple, with CDN |
| Real-time chat | Supabase Realtime | WebSocket channels built-in |
| Email | Resend | Modern, developer-friendly |
| Book metadata | Google Books API + OpenLibrary | Free, comprehensive |
| Routing | React Router v6 | Already in place |
| Testing | Vitest + Testing Library | Already in place |
| Deployment | Vercel | Best Vite + Edge support |

---

## 3. Project Setup & Monorepo Structure

### 3.1 Install New Dependencies

```bash
# Supabase client
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared

# State management
npm install zustand

# Image handling & upload UI
npm install react-dropzone browser-image-compression

# Infinite scroll & virtualization
npm install @tanstack/react-virtual

# Rich text editor (for posts/reviews)
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder

# Date utilities (already have date-fns)
# Toast (already have sonner)

# Video streaming
npm install hls.js
```

### 3.2 Recommended Folder Structure

```
src/
├── assets/
├── components/
│   ├── ui/                  # shadcn components (keep as-is)
│   ├── auth/                # Login, Register, OAuthButton
│   ├── books/               # BookCard, BookSearch, BookDetail
│   ├── community/           # PostCard, PostEditor, ClubCard
│   ├── live/                # LiveCard, LivePlayer, ChatPanel
│   ├── profile/             # ProfileHeader, ShelfGrid, BadgeList
│   └── shared/              # AppLayout, ThemeToggle, ProgressRing
├── hooks/
│   ├── useAuth.ts
│   ├── useBooks.ts
│   ├── usePosts.ts
│   ├── useUpload.ts
│   ├── useRealtime.ts
│   └── useReadingProgress.ts
├── lib/
│   ├── supabase.ts          # Supabase client singleton
│   ├── utils.ts
│   ├── validations.ts       # Zod schemas
│   └── constants.ts
├── pages/                   # Keep existing pages, wire up real data
├── store/
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── readingStore.ts
├── types/
│   ├── database.ts          # Generated from Supabase
│   └── api.ts
└── services/
    ├── books.ts             # Google Books API wrapper
    ├── notifications.ts
    └── analytics.ts
```

---

## 4. Database Design (Supabase / PostgreSQL)

### 4.1 Initialize Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize in project root
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Generate TypeScript types after schema changes
supabase gen types typescript --local > src/types/database.ts
```

### 4.2 Full Schema

Run these migrations in the Supabase SQL Editor:

```sql
-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  header_url text,
  reading_goal integer default 20,
  streak_days integer default 0,
  last_read_at timestamptz,
  is_public boolean default true,
  location text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- BOOKS (local cache + custom entries)
-- =============================================
create table public.books (
  id uuid primary key default gen_random_uuid(),
  google_books_id text unique,
  open_library_id text,
  title text not null,
  author text not null,
  cover_url text,
  description text,
  pages integer,
  genre text,
  mood text,
  published_date date,
  isbn text,
  language text default 'en',
  rating_avg numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- USER SHELVES (the core reading list feature)
-- =============================================
create type shelf_status as enum ('reading', 'tbr', 'finished', 'dnf', 'wishlist');

create table public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  status shelf_status not null,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  current_page integer default 0,
  rating integer check (rating >= 1 and rating <= 5),
  started_at date,
  finished_at date,
  notes text,
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

-- =============================================
-- POSTS (feed: reviews, quotes, updates, polls)
-- =============================================
create type post_type as enum ('review', 'quote', 'update', 'poll');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  type post_type not null,
  content text not null,
  rating integer check (rating >= 1 and rating <= 5),
  contains_spoilers boolean default false,
  image_urls text[],
  likes_count integer default 0,
  comments_count integer default 0,
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  likes_count integer default 0,
  created_at timestamptz default now()
);

create table public.post_bookmarks (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- =============================================
-- FOLLOWS (social graph)
-- =============================================
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- =============================================
-- CLUBS
-- =============================================
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  avatar_url text,
  header_url text,
  current_book_id uuid references public.books(id),
  owner_id uuid references public.profiles(id),
  is_public boolean default true,
  member_count integer default 0,
  created_at timestamptz default now()
);

create type club_role as enum ('member', 'moderator', 'owner');

create table public.club_members (
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role club_role default 'member',
  joined_at timestamptz default now(),
  primary key (club_id, user_id)
);

create table public.club_discussions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  reply_count integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- LIVE SESSIONS
-- =============================================
create type session_status as enum ('scheduled', 'live', 'ended');

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  description text,
  thumbnail_url text,
  stream_key text,
  status session_status default 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  viewer_count integer default 0,
  max_viewers integer default 0,
  created_at timestamptz default now()
);

create table public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.live_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- =============================================
-- MESSAGES (direct messages)
-- =============================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  last_read_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  book_id uuid references public.books(id),  -- share a book in chat
  created_at timestamptz default now()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
create type notification_type as enum (
  'like', 'comment', 'follow', 'club_invite', 'live_started', 'mention', 'review'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type notification_type not null,
  entity_id uuid,           -- post_id, session_id, etc.
  entity_type text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- READING SESSIONS (for streak tracking)
-- =============================================
create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  pages_read integer default 0,
  minutes_read integer default 0,
  session_date date default current_date,
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index on public.posts(user_id);
create index on public.posts(book_id);
create index on public.posts(created_at desc);
create index on public.user_books(user_id);
create index on public.follows(follower_id);
create index on public.follows(following_id);
create index on public.notifications(user_id, is_read);
create index on public.live_chat_messages(session_id, created_at);
create index on public.messages(conversation_id, created_at);
```

### 4.3 Row-Level Security (RLS)

Enable RLS on every table and add policies. Example for posts:

```sql
alter table public.posts enable row level security;

-- Anyone can read public posts
create policy "Public posts are viewable by everyone"
  on public.posts for select
  using (not is_private);

-- Users can read their own private posts
create policy "Users can read their own posts"
  on public.posts for select
  using (auth.uid() = user_id);

-- Only authenticated users can create posts
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- Users can only update/delete their own posts
create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);
```

Apply similar policies to all other tables.

---

## 5. Authentication & User Profiles

### 5.1 Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
```

### 5.2 Auth Store (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  },

  signInWithGithub: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  },

  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    // Profile is auto-created by a database trigger (see below)
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  updateProfile: async (data) => {
    const user = get().user
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) throw error
    set((state) => ({ profile: state.profile ? { ...state.profile, ...data } : null }))
  },
}))
```

### 5.3 Auto-Create Profile Trigger

```sql
-- Run in Supabase SQL Editor
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 5.4 Auth Pages

Replace the placeholder auth with a real `LoginPage.tsx` and `RegisterPage.tsx`:

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithEmail, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmail(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 glass-card space-y-6">
        <h1 className="font-heading text-3xl font-bold">Welcome back</h1>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full gold-gradient text-accent-foreground"
            disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <Button variant="outline" className="w-full gap-2" onClick={signInWithGoogle}>
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
```

### 5.5 Protected Routes

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

Update `App.tsx` to wrap private routes with `<ProtectedRoute>`.

---

## 6. File Uploads (Covers, Avatars, Thumbnails)

### 6.1 Supabase Storage Buckets

Create these buckets in Supabase Dashboard → Storage:

| Bucket | Public? | Use |
|---|---|---|
| `avatars` | Yes | Profile pictures |
| `book-covers` | Yes | Custom book cover uploads |
| `live-thumbnails` | Yes | Session thumbnails |
| `post-images` | Yes | Images attached to posts |
| `club-assets` | Yes | Club headers/avatars |

Set file size limits and allowed MIME types in each bucket's policies.

### 6.2 Upload Hook

```typescript
// src/hooks/useUpload.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

interface UploadOptions {
  bucket: string
  folder?: string
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

export function useUpload() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const upload = useCallback(async (file: File, options: UploadOptions): Promise<string> => {
    setIsUploading(true)
    setProgress(0)

    try {
      // Compress image before upload
      const compressed = await imageCompression(file, {
        maxSizeMB: options.maxSizeMB ?? 1,
        maxWidthOrHeight: options.maxWidthOrHeight ?? 1200,
        useWebWorker: true,
        onProgress: (p) => setProgress(p / 2), // first half is compression
      })

      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

      const { error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      setProgress(100)

      const { data } = supabase.storage.from(options.bucket).getPublicUrl(filePath)
      return data.publicUrl
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { upload, progress, isUploading }
}
```

### 6.3 Avatar Upload Component

```typescript
// src/components/shared/AvatarUpload.tsx
import { useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera } from 'lucide-react'
import { useUpload } from '@/hooks/useUpload'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AvatarUpload() {
  const { profile, updateProfile } = useAuthStore()
  const { upload, isUploading, progress } = useUpload()

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    onDrop: async (files) => {
      const url = await upload(files[0], {
        bucket: 'avatars',
        folder: profile?.id,
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
      })
      await updateProfile({ avatar_url: url })
    },
  })

  return (
    <div {...getRootProps()} className="relative cursor-pointer group">
      <input {...getInputProps()} />
      <Avatar className="h-24 w-24 border-4 border-accent/30">
        <AvatarImage src={profile?.avatar_url} />
        <AvatarFallback className="text-2xl">{profile?.display_name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
        opacity-0 group-hover:opacity-100 transition-opacity">
        {isUploading
          ? <span className="text-white text-xs">{progress}%</span>
          : <Camera className="h-6 w-6 text-white" />
        }
      </div>
    </div>
  )
}
```

---

## 7. Making Every Button Functional

Here is a component-by-component breakdown of every interactive element in the current prototype and what needs to be wired up.

### 7.1 Add to Shelf Button

Every `BookCard` and `BookDetailPage` has an **Add to Shelf** button. Replace it with:

```typescript
// src/components/books/AddToShelfButton.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { BookOpen, Check, Plus, BookMarked, Clock, X } from 'lucide-react'

const SHELF_OPTIONS = [
  { value: 'reading', label: 'Currently Reading', icon: BookOpen },
  { value: 'tbr', label: 'Want to Read', icon: Clock },
  { value: 'finished', label: 'Finished', icon: Check },
  { value: 'wishlist', label: 'Wishlist', icon: BookMarked },
]

export function AddToShelfButton({ bookId }: { bookId: string }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: userBook } = useQuery({
    queryKey: ['user-book', user?.id, bookId],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      if (!user) throw new Error('Not authenticated')
      if (userBook) {
        await supabase.from('user_books')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', userBook.id)
      } else {
        await supabase.from('user_books')
          .insert({ user_id: user.id, book_id: bookId, status })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-book', user?.id, bookId] })
      queryClient.invalidateQueries({ queryKey: ['my-books', user?.id] })
    },
  })

  const currentOption = SHELF_OPTIONS.find(o => o.value === userBook?.status)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gold-gradient text-accent-foreground border-0 gap-2">
          {currentOption ? <currentOption.icon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {currentOption ? currentOption.label : 'Add to Shelf'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SHELF_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => mutation.mutate(opt.value)}
            className="gap-2">
            <opt.icon className="h-4 w-4" />
            {opt.label}
            {userBook?.status === opt.value && <Check className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 7.2 Like / Unlike Button

```typescript
// src/components/community/LikeButton.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

export function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: hasLiked } = useQuery({
    queryKey: ['like', user?.id, postId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()
      return !!data
    },
    enabled: !!user,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      if (hasLiked) {
        await supabase.from('post_likes')
          .delete().eq('post_id', postId).eq('user_id', user.id)
      } else {
        await supabase.from('post_likes')
          .insert({ post_id: postId, user_id: user.id })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', user?.id, postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <Button variant="ghost" size="sm"
      className={`gap-1.5 ${hasLiked ? 'text-destructive' : 'text-muted-foreground'}`}
      onClick={() => mutation.mutate()}>
      <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
      <span className="text-xs">{initialCount}</span>
    </Button>
  )
}
```

### 7.3 Follow Button

```typescript
// src/components/profile/FollowButton.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: isFollowing } = useQuery({
    queryKey: ['follow', user?.id, targetUserId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()
      return !!data
    },
    enabled: !!user && user.id !== targetUserId,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      if (isFollowing) {
        await supabase.from('follows')
          .delete().eq('follower_id', user.id).eq('following_id', targetUserId)
      } else {
        await supabase.from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', user?.id, targetUserId] })
    },
  })

  if (!user || user.id === targetUserId) return null

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={() => mutation.mutate()}
      className={isFollowing ? '' : 'gold-gradient text-accent-foreground border-0'}>
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
```

### 7.4 Post Editor (New Post / Review)

```typescript
// src/components/community/PostEditor.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BookSearch } from './BookSearch'

const postSchema = z.object({
  content: z.string().min(1, 'Say something!').max(2000),
  type: z.enum(['review', 'quote', 'update', 'poll']),
  rating: z.number().min(1).max(5).optional(),
  bookId: z.string().uuid().optional(),
  containsSpoilers: z.boolean().default(false),
})

type PostForm = z.infer<typeof postSchema>

export function PostEditor({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedBook, setSelectedBook] = useState(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { type: 'update' },
  })

  const mutation = useMutation({
    mutationFn: async (data: PostForm) => {
      const { error } = await supabase.from('posts').insert({
        user_id: user!.id,
        content: data.content,
        type: data.type,
        rating: data.rating,
        book_id: data.bookId,
        contains_spoilers: data.containsSpoilers,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      onClose()
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {/* Type selector, book search, rating, content textarea, submit */}
      <Textarea
        {...register('content')}
        placeholder="Share your thoughts..."
        className="min-h-[100px]"
      />
      {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="gold-gradient text-accent-foreground border-0"
          disabled={mutation.isPending}>
          {mutation.isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  )
}
```

### 7.5 Progress Update

Replace the static progress bars on `MyBooksPage` with:

```typescript
// src/components/books/ProgressUpdater.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

export function ProgressUpdater({ userBookId, currentPage, totalPages }: {
  userBookId: string; currentPage: number; totalPages: number
}) {
  const [page, setPage] = useState(currentPage)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (newPage: number) => {
      const progress = Math.round((newPage / totalPages) * 100)
      const isFinished = progress === 100
      const { error } = await supabase.from('user_books').update({
        current_page: newPage,
        progress,
        status: isFinished ? 'finished' : 'reading',
        finished_at: isFinished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', userBookId)
      if (error) throw error

      // Log reading session
      await supabase.from('reading_sessions').insert({
        book_id: userBookId, // you'd pass book_id here
        pages_read: Math.max(0, newPage - currentPage),
        session_date: new Date().toISOString().split('T')[0],
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-books'] }),
  })

  return (
    <div className="space-y-2">
      <Slider
        value={[page]}
        min={0}
        max={totalPages}
        step={1}
        onValueChange={([v]) => setPage(v)}
      />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <Button size="sm" variant="outline"
          onClick={() => mutation.mutate(page)}
          disabled={mutation.isPending}>
          Save
        </Button>
      </div>
    </div>
  )
}
```

---

## 8. Real-Time Features (Live Sessions & Chat)

### 8.1 Direct Messages

```typescript
// src/hooks/useMessages.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useMessages(conversationId: string) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`*, sender:profiles(id, display_name, avatar_url)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data)
    }
    fetchMessages()

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const sendMessage = useCallback(async (content: string, bookId?: string) => {
    if (!user) return
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      book_id: bookId,
    })
    // Update last_read_at
    await supabase.from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
  }, [user, conversationId])

  return { messages, sendMessage }
}
```

### 8.2 Live Session Chat

```typescript
// src/hooks/useLiveChat.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useLiveChat(sessionId: string) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([])
  const [viewerCount, setViewerCount] = useState(0)

  useEffect(() => {
    // Presence channel for viewer count
    const presenceChannel = supabase.channel(`live:${sessionId}`, {
      config: { presence: { key: user?.id ?? 'anon' } },
    })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setViewerCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user?.id })
        }
      })

    // Chat messages channel
    const chatChannel = supabase
      .channel(`live-chat:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages((prev) => [...prev.slice(-199), payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [sessionId, user?.id])

  const sendMessage = useCallback(async (content: string) => {
    if (!user) return
    await supabase.from('live_chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      content,
    })
  }, [user, sessionId])

  return { messages, viewerCount, sendMessage }
}
```

---

## 9. Search & Discovery

### 9.1 Full-Text Search via Supabase

```sql
-- Enable full-text search on books
alter table public.books add column search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(author, ''))
  ) stored;

create index on public.books using gin(search_vector);

-- Search function
create or replace function search_books(query text)
returns setof public.books as $$
  select * from public.books
  where search_vector @@ plainto_tsquery('english', query)
  order by ts_rank(search_vector, plainto_tsquery('english', query)) desc
  limit 20;
$$ language sql stable;
```

```typescript
// src/hooks/useSearch.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useDebounce } from 'use-debounce'  // npm install use-debounce

export function useBookSearch(query: string) {
  const [debouncedQuery] = useDebounce(query, 300)

  return useQuery({
    queryKey: ['book-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return []
      const { data } = await supabase.rpc('search_books', { query: debouncedQuery })
      return data ?? []
    },
    enabled: debouncedQuery.length > 1,
  })
}
```

---

## 10. Book Data — External APIs

### 10.1 Google Books API Service

```typescript
// src/services/books.ts
const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1'

export async function searchGoogleBooks(query: string, maxResults = 10) {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    key: import.meta.env.VITE_GOOGLE_BOOKS_API_KEY,
  })
  const res = await fetch(`${GOOGLE_BOOKS_BASE}/volumes?${params}`)
  const data = await res.json()
  return data.items?.map(normalizeGoogleBook) ?? []
}

function normalizeGoogleBook(item: any) {
  const info = item.volumeInfo
  return {
    google_books_id: item.id,
    title: info.title,
    author: info.authors?.[0] ?? 'Unknown',
    cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') ?? null,
    description: info.description,
    pages: info.pageCount,
    genre: info.categories?.[0],
    isbn: info.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier,
    published_date: info.publishedDate,
  }
}

export async function addBookToDatabase(googleBookData: ReturnType<typeof normalizeGoogleBook>) {
  const { supabase } = await import('@/lib/supabase')
  // Upsert so we don't create duplicates
  const { data } = await supabase
    .from('books')
    .upsert(googleBookData, { onConflict: 'google_books_id' })
    .select('id')
    .single()
  return data?.id
}
```

---

## 11. Notifications

### 11.1 Notification Hook

```typescript
// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useNotifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select(`*, actor:profiles(id, display_name, avatar_url)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    }
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return { notifications, unreadCount, markAllRead }
}
```

### 11.2 Database Triggers for Notifications

```sql
-- Notify on new like
create or replace function notify_on_like()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner != new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
    values (post_owner, new.user_id, 'like', new.post_id, 'post');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_post_like
  after insert on public.post_likes
  for each row execute procedure notify_on_like();

-- Notify on new follow
create or replace function notify_on_follow()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
  values (new.following_id, new.follower_id, 'follow', new.follower_id, 'profile');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_follow
  after insert on public.follows
  for each row execute procedure notify_on_follow();
```

---

## 12. Reading Progress Tracking

### 12.1 Streak Calculation

```sql
-- Function to calculate current streak for a user
create or replace function get_reading_streak(p_user_id uuid)
returns integer as $$
declare
  streak integer := 0;
  check_date date := current_date;
begin
  loop
    if exists (
      select 1 from public.reading_sessions
      where user_id = p_user_id and session_date = check_date
    ) then
      streak := streak + 1;
      check_date := check_date - 1;
    else
      exit;
    end if;
  end loop;
  return streak;
end;
$$ language plpgsql stable;
```

### 12.2 Update Streak After Session

Update `profiles.streak_days` in a trigger after a new reading session is logged:

```sql
create or replace function update_streak_on_session()
returns trigger as $$
begin
  update public.profiles
  set
    streak_days = get_reading_streak(new.user_id),
    last_read_at = now()
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_reading_session
  after insert on public.reading_sessions
  for each row execute procedure update_streak_on_session();
```

---

## 13. Clubs & Community

### 13.1 Join Club

```typescript
// src/hooks/useClub.ts
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useClubMembership(clubId: string) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: isMember } = useQuery({
    queryKey: ['club-member', user?.id, clubId],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('user_id', user!.id)
        .maybeSingle()
      return !!data
    },
    enabled: !!user,
  })

  const joinMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('club_members').insert({ club_id: clubId, user_id: user!.id })
      // Increment member count
      await supabase.rpc('increment_club_members', { club_id: clubId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['club-member', user?.id, clubId] }),
  })

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('club_members')
        .delete().eq('club_id', clubId).eq('user_id', user!.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['club-member', user?.id, clubId] }),
  })

  return { isMember, join: joinMutation.mutate, leave: leaveMutation.mutate }
}
```

---

## 14. Responsive Design Hardening

The existing Tailwind classes are good. These are the remaining gaps to fix:

### 14.1 Image Loading & Fallbacks

All `<img>` tags need proper fallbacks:

```typescript
// src/components/shared/BookCover.tsx
import { useState } from 'react'
import { BookOpen } from 'lucide-react'

export function BookCover({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className={`bg-secondary flex items-center justify-center ${className}`}>
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}
```

### 14.2 Virtual Scrolling for Large Lists

For the `MyBooksPage` shelf and feed with many items, use TanStack Virtual:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

function VirtualFeed({ posts }: { posts: Post[] }) {
  const parentRef = useRef(null)
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  })

  return (
    <div ref={parentRef} style={{ height: '100vh', overflowY: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div key={item.key} style={{ position: 'absolute', top: item.start, width: '100%' }}>
            <PostCard post={posts[item.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 14.3 Mobile Touch Gestures

Add swipe-to-dismiss and pull-to-refresh using native browser APIs on the main feed.

---

## 15. State Management

### 15.1 UI Store

```typescript
// src/store/uiStore.ts
import { create } from 'zustand'

interface UIState {
  isPostEditorOpen: boolean
  isMobileNavOpen: boolean
  openPostEditor: () => void
  closePostEditor: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isPostEditorOpen: false,
  isMobileNavOpen: false,
  openPostEditor: () => set({ isPostEditorOpen: true }),
  closePostEditor: () => set({ isPostEditorOpen: false }),
}))
```

The FAB (`+` button) in `AppLayout.tsx` should call `openPostEditor()`. Add a `<PostEditorModal>` to the layout that renders when `isPostEditorOpen` is true.

---

## 16. API Layer (tRPC or REST)

For the current project scale, **direct Supabase client calls** from React Query hooks are sufficient. If the app grows to need server-side validation, rate limiting, or external API orchestration, add a thin **Supabase Edge Function** layer:

```typescript
// supabase/functions/recommend-books/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const { userId } = await req.json()
  // Fetch user's genre preferences, call external recommendation API
  // Return personalized recommendations
  return new Response(JSON.stringify({ books: [] }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Deploy with: `supabase functions deploy recommend-books`

---

## 17. Testing Strategy

### 17.1 Unit Tests (Vitest)

Test pure logic: Zod schemas, utility functions, store actions.

```typescript
// src/lib/__tests__/validations.test.ts
import { describe, it, expect } from 'vitest'
import { postSchema } from '@/lib/validations'

describe('postSchema', () => {
  it('rejects empty content', () => {
    expect(() => postSchema.parse({ content: '', type: 'review' })).toThrow()
  })
  it('accepts valid post', () => {
    const result = postSchema.parse({ content: 'Great book!', type: 'review', rating: 5 })
    expect(result.content).toBe('Great book!')
  })
})
```

### 17.2 Integration Tests (Testing Library)

```typescript
// src/components/__tests__/LikeButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LikeButton } from '../community/LikeButton'
import { vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

test('LikeButton toggles like state', async () => {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <LikeButton postId="test-id" initialCount={5} />
    </QueryClientProvider>
  )
  expect(screen.getByText('5')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(screen.getByRole('button')).toHaveClass('text-destructive'))
})
```

### 17.3 E2E Tests (Playwright — optional)

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[type=email]', 'test@example.com')
  await page.fill('[type=password]', 'testpassword')
  await page.click('[type=submit]')
  await expect(page).toHaveURL('/')
  await expect(page.locator('text=BookNest')).toBeVisible()
})
```

---

## 18. Deployment & CI/CD

### 18.1 Vercel Deployment

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in Vercel dashboard under Project Settings → Environment Variables.

### 18.2 GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 19. Environment Variables Checklist

Create `.env.local` (never commit to git):

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Books API
VITE_GOOGLE_BOOKS_API_KEY=your-key

# Optional: Liveblocks for collaborative reading
VITE_LIVEBLOCKS_PUBLIC_KEY=pk_...

# Optional: Cloudinary (if using instead of Supabase Storage)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

Add all of these to Vercel's environment variables for the production deployment.

---

## 20. Migration Roadmap (Phase-by-Phase)

### Phase 1 — Foundation (Week 1–2)
- [ ] Set up Supabase project and run full schema migration
- [ ] Implement `src/lib/supabase.ts` client
- [ ] Build `LoginPage`, `RegisterPage`, and `AuthCallbackPage`
- [ ] Implement Zustand `authStore` with session persistence
- [ ] Add `ProtectedRoute` wrapper and update `App.tsx`
- [ ] Wire up profile auto-creation trigger
- [ ] Add all environment variables to `.env.local` and Vercel

### Phase 2 — Core Reading Features (Week 3–4)
- [ ] Replace mock `books` data with real Supabase queries via React Query
- [ ] Implement `AddToShelfButton` with real DB mutations
- [ ] Build `ProgressUpdater` component with slider
- [ ] Wire up `MyBooksPage` shelves with live data
- [ ] Implement Google Books API search and `BookSearch` component
- [ ] Add book detail page with real data + Add to Shelf

### Phase 3 — Social Features (Week 5–6)
- [ ] Implement `PostEditor` with form validation
- [ ] Wire up `PostCard` likes, comments, bookmarks
- [ ] Implement `FollowButton` and follow/unfollow flow
- [ ] Build `ProfilePage` with real follower/following counts
- [ ] Set up notification triggers in database
- [ ] Implement `useNotifications` hook and bell icon badge

### Phase 4 — Real-Time & Uploads (Week 7–8)
- [ ] Set up Supabase Storage buckets with policies
- [ ] Implement `useUpload` hook and `AvatarUpload` component
- [ ] Wire up `ChatPage` with `useMessages` real-time hook
- [ ] Wire up `LivePage` chat panel with `useLiveChat`
- [ ] Add presence/viewer count to live sessions
- [ ] Implement post image upload via drag-and-drop

### Phase 5 — Polish & Performance (Week 9–10)
- [ ] Add virtual scrolling to feeds with 50+ items
- [ ] Implement full-text search with debouncing
- [ ] Add `BookCover` component with graceful fallbacks
- [ ] Write unit tests for all utility functions and Zod schemas
- [ ] Write integration tests for key user flows (like, follow, add book)
- [ ] Set up GitHub Actions CI pipeline
- [ ] Deploy to production via Vercel
- [ ] Configure custom domain

---

## Quick Reference: Key Files to Create or Modify

| File | Action | Purpose |
|---|---|---|
| `src/lib/supabase.ts` | Create | Supabase client singleton |
| `src/types/database.ts` | Generate | TypeScript types from DB schema |
| `src/store/authStore.ts` | Create | Auth state management |
| `src/store/uiStore.ts` | Create | UI state (modals, nav) |
| `src/hooks/useUpload.ts` | Create | File upload logic |
| `src/hooks/useMessages.ts` | Create | Real-time DMs |
| `src/hooks/useLiveChat.ts` | Create | Live session chat |
| `src/hooks/useNotifications.ts` | Create | Real-time notifications |
| `src/pages/LoginPage.tsx` | Create | Authentication UI |
| `src/pages/RegisterPage.tsx` | Create | Registration UI |
| `src/components/auth/ProtectedRoute.tsx` | Create | Route guard |
| `src/components/books/AddToShelfButton.tsx` | Create | Shelf management |
| `src/components/books/ProgressUpdater.tsx` | Create | Reading progress |
| `src/components/community/LikeButton.tsx` | Create | Like/unlike posts |
| `src/components/community/PostEditor.tsx` | Create | Create posts/reviews |
| `src/components/profile/FollowButton.tsx` | Create | Follow/unfollow |
| `src/components/shared/AvatarUpload.tsx` | Create | Profile picture upload |
| `src/services/books.ts` | Create | Google Books API wrapper |
| `src/App.tsx` | Modify | Add auth routes + ProtectedRoute |
| `src/components/AppLayout.tsx` | Modify | Wire FAB to PostEditor, add notification badge |
| `src/lib/mock-data.ts` | Deprecate | Replace with real API calls |

---

*This guide covers everything needed to take the BookNest prototype from a static UI to a production social reading app. Each phase is independently deployable — users can log in and use real auth after Phase 1, and each subsequent phase adds real functionality without breaking what came before.*
