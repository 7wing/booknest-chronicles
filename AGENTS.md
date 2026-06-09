# AGENTS.md — BookNest

This file tells the coding agent how to implement the BookNest app. Read this fully before touching any code.

---

## Project Overview

BookNest is a React 18 + Vite + TailwindCSS + shadcn/ui social reading platform. The frontend prototype already exists with static/mock data. Your job is to wire it up to a real Supabase backend — replacing all mock data with live queries, adding auth, file uploads, real-time chat, book data from the Google Books API, and notifications.

---

## Stack (do not deviate)

- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, shadcn/ui
- **Server state:** TanStack Query v5 — use this for ALL server state, no raw useEffect fetches
- **Client state:** Zustand — for auth store and UI store
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Book metadata:** Google Books API
- **Routing:** React Router v6
- **File uploads:** Supabase Storage + browser-image-compression
- **Hosting:** Vercel

---

## Constraints (never violate these)

- Never alter existing project configuration (`vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`) unless explicitly required and noted
- All new code must use TanStack Query v5, React Hook Form + Zod, and Supabase JS v2 patterns
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend — ever
- Do not modify `.env.local` or commit secrets
- Do not call Supabase directly inside JSX render — always go through hooks
- Do not use `localStorage` or `sessionStorage` for auth state — Supabase handles it
---

## Assumptions

- The Supabase project has been created and all env vars in `.env.local` are valid
- The human will execute `SUPABASE_STEPS.md` SQL in the Supabase SQL Editor before running the app
- `@supabase/supabase-js`, `zustand`, `browser-image-compression`, and `react-dropzone` are not yet installed
- TypeScript database types will be regenerated after schema creation — use a minimal placeholder until then
- Google Books API key is already in `.env.local` as `VITE_GOOGLE_BOOKS_API_KEY`
---

## Implementation Order

Work in this exact order. Do not skip ahead. Run `npm run build` to verify each phase before moving on.

---

### Phase 1 — Foundation

**Goal:** Install dependencies, create the Supabase handoff document, typed client, auth store, auth pages, and protect all routes.

#### Step 0 — Create SUPABASE_STEPS.md (do this before any code)

Create `SUPABASE_STEPS.md` at the project root containing everything the human must do manually in the Supabase dashboard:

- Complete schema SQL for all tables in dependency order: `profiles`, `books`, `user_books`, `posts`, `post_likes`, `post_comments`, `post_bookmarks`, `follows`, `clubs`, `club_members`, `club_discussions`, `live_sessions`, `live_chat_messages`, `conversations`, `conversation_participants`, `messages`, `notifications`, `reading_sessions`
- All RLS policies for every table
- The `handle_new_user` trigger that auto-creates a profile row on signup
- The `notify_on_like` and `notify_on_follow` notification trigger functions
- The `update_streak_on_session` trigger and `get_reading_streak` function
- The `search_vector` tsvector column and `search_books` RPC function on the `books` table
- The `increment_club_members` RPC function
- Storage bucket creation instructions: `avatars` (public), `book-covers` (public), `live-thumbnails` (public), `post-images` (public), `club-assets` (public)
- Storage RLS policies for each bucket
- The type generation command: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts`
- A checklist of every manual step the human must complete before running the app

**Verify:** `test -f SUPABASE_STEPS.md`

#### Step 1 — Install dependencies and create typed client

- Install: `@supabase/supabase-js zustand browser-image-compression react-dropzone use-debounce`
- Create `src/lib/supabase.ts` with `createClient<Database>` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, with `persistSession: true` and `autoRefreshToken: true`
- Create `src/types/database.ts` with a minimal `Database` interface covering all tables as placeholders, plus a TODO comment with the full type-generation CLI command

**Verify:** `grep -q '@supabase/supabase-js' package.json && test -f src/lib/supabase.ts && test -f src/types/database.ts`

#### Step 2 — Auth store and helpers

- Create `src/store/authStore.ts` (Zustand) exposing: `user`, `session`, `profile`, `isLoading`, `signInWithEmail`, `signInWithGoogle`, `signInWithGithub`, `signUp` (inserts profiles row after auth.signUp), `signOut`, `updateProfile`
- Create `src/store/uiStore.ts` (Zustand) exposing: `isPostEditorOpen`, `openPostEditor`, `closePostEditor`, `isMobileNavOpen`

**Verify:** `test -f src/store/authStore.ts && test -f src/store/uiStore.ts`

#### Step 3 — Auth UI and route protection

- Create `src/pages/LoginPage.tsx` — email/password + Google + GitHub OAuth, using shadcn/ui Card/Input/Button, React Hook Form + Zod validation
- Create `src/pages/RegisterPage.tsx` — username + email + password fields, same validation pattern
- Create `src/pages/AuthCallbackPage.tsx` — handles OAuth PKCE callback (`exchangeCodeForSession`), redirects to `/` on success
- Create `src/components/auth/ProtectedRoute.tsx` — redirects to `/login` if not logged in, shows loading state while auth initializes
- Modify `src/App.tsx` — add `/login`, `/register`, `/auth/callback` routes; wrap all existing routes with `ProtectedRoute`

**Verify:** `test -f src/pages/LoginPage.tsx && test -f src/pages/RegisterPage.tsx && test -f src/components/auth/ProtectedRoute.tsx && grep -q 'ProtectedRoute' src/App.tsx`

#### Step 4 — Build verification

**Verify:** `npm run build`

**Gate:** User can sign up, log in (email or OAuth), and reach the app. Unauthenticated users redirect to `/login`.

---

### Phase 2 — Core Reading Features

**Goal:** Replace mock book and shelf data with live Supabase + Google Books API queries.

#### Step 1 — Google Books API service

Create `src/services/books.ts`:
- `searchGoogleBooks(query, maxResults?)` — fetches from Google Books API, normalizes response
- `addBookToDatabase(bookData)` — upserts into `books` table via Supabase, returns `id`

**Verify:** `test -f src/services/books.ts`

#### Step 2 — Book and shelf query hooks

Create `src/hooks/useBooks.ts`:
- `useMyBooks(status?)` — fetches `user_books` joined with `books` for current user, optionally filtered by shelf status
- `useBook(bookId)` — fetches a single book by id
- `useAddToShelf()` — upserts into `user_books`, invalidates `['my-books']` on success
- `useUpdateShelfEntry()` — updates status/progress/rating on a `user_books` row
- `useBookSearch(query)` — debounced full-text search via `supabase.rpc('search_books', ...)`, falls back to Google Books API if no local results

**Verify:** `test -f src/hooks/useBooks.ts`

#### Step 3 — Reading progress hooks

Create `src/hooks/useReadingProgress.ts`:
- `useUpdateProgress()` — updates `current_page` and `progress` on `user_books`, logs a `reading_sessions` row, marks `finished` if progress = 100
- `useReadingStreak(userId)` — calls `supabase.rpc('get_reading_streak', ...)`

**Verify:** `test -f src/hooks/useReadingProgress.ts`

#### Step 4 — Wire MyBooksPage

Modify `src/pages/MyBooksPage.tsx` (or equivalent shelf page):
- Replace mock book arrays with `useMyBooks(status)` per shelf tab
- Show loading skeletons while fetching
- Show empty state per shelf when no books exist

**Verify:** `grep -q 'useMyBooks' src/pages/MyBooksPage.tsx`

#### Step 5 — AddToShelfButton component

Create `src/components/books/AddToShelfButton.tsx`:
- Dropdown with shelf options: Currently Reading, Want to Read, Finished, Wishlist, DNF
- Reads current status from `useMyBooks` or a targeted `user_books` query
- Calls `useAddToShelf()` on selection
- Shows current status with a checkmark

**Verify:** `test -f src/components/books/AddToShelfButton.tsx`

#### Step 6 — ProgressUpdater component

Create `src/components/books/ProgressUpdater.tsx`:
- Slider input for current page (0 to totalPages)
- Save button calls `useUpdateProgress()`
- Disables while mutation is pending

**Verify:** `test -f src/components/books/ProgressUpdater.tsx`

#### Step 7 — BookCover component

Create `src/components/shared/BookCover.tsx`:
- Renders `<img>` with `loading="lazy"` and `onError` fallback
- Fallback shows a `BookOpen` icon placeholder
- Use this everywhere a book cover image is displayed

**Verify:** `test -f src/components/shared/BookCover.tsx`

#### Step 8 — Build verification

**Verify:** `npm run build`

**Gate:** Can search for books, add them to shelves, and update reading progress with real data.

---

### Phase 3 — Social Features

**Goal:** Wire the community feed, likes, comments, follows, and notifications to real data.

#### Step 1 — Post hooks

Create `src/hooks/usePosts.ts`:
- `useFeed(tab?)` — fetches posts joined with `profiles` and `books`, filtered by Following tab (only posts from followed users) or For You (all public posts), ordered by `created_at desc`
- `useCreatePost()` — inserts into `posts`, invalidates `['posts']` on success
- `useToggleLike(postId)` — inserts/deletes from `post_likes`, updates `likes_count` via RPC or optimistic update
- `useComments(postId)` — fetches `post_comments` joined with `profiles`
- `useAddComment()` — inserts into `post_comments`, invalidates `['comments', postId]`
- `useToggleBookmark(postId)` — inserts/deletes from `post_bookmarks`

**Verify:** `test -f src/hooks/usePosts.ts`

#### Step 2 — Profile and follow hooks

Create `src/hooks/useProfile.ts`:
- `useProfile(userId?)` — fetches a profile by id (defaults to current user)
- `useUpdateProfile()` — updates `profiles` table, invalidates profile query
- `useIsFollowing(targetUserId)` — checks `follows` table
- `useToggleFollow(targetUserId)` — inserts/deletes from `follows`, invalidates follow query

**Verify:** `test -f src/hooks/useProfile.ts`

#### Step 3 — Notification hook

Create `src/hooks/useNotifications.ts`:
- `useNotifications()` — fetches notifications joined with `profiles` (actor), ordered by `created_at desc`, limit 30
- Subscribes to Supabase Realtime INSERT on `notifications` filtered by `user_id`
- `markAllRead()` — updates all unread notifications to `is_read = true`
- Returns `notifications`, `unreadCount`, `markAllRead`

**Verify:** `test -f src/hooks/useNotifications.ts`

#### Step 4 — Wire community feed

Modify `src/pages/CommunityPage.tsx` (or feed equivalent):
- Replace mock posts with `useFeed(activeTab)` hook
- Wire like button to `useToggleLike()`
- Wire comments button to expandable section using `useComments(postId)`
- Wire bookmark button to `useToggleBookmark()`

**Verify:** `grep -q 'useFeed\|usePosts' src/pages/CommunityPage.tsx`

#### Step 5 — PostEditor component

Create `src/components/community/PostEditor.tsx`:
- React Hook Form + Zod validation
- Fields: content (textarea), type (review/quote/update/poll selector), rating (1–5 stars, optional), book search (links to a book), contains_spoilers toggle
- Submit calls `useCreatePost()` mutation
- Open/close controlled by `useUIStore().isPostEditorOpen`

**Verify:** `test -f src/components/community/PostEditor.tsx`

#### Step 6 — LikeButton and FollowButton components

- Create `src/components/community/LikeButton.tsx` — wired to `useToggleLike()`, shows filled heart when liked
- Create `src/components/profile/FollowButton.tsx` — wired to `useToggleFollow()`, hidden for own profile

**Verify:** `test -f src/components/community/LikeButton.tsx && test -f src/components/profile/FollowButton.tsx`

#### Step 7 — Wire ProfilePage and AppLayout

- Modify `src/pages/ProfilePage.tsx` — replace mock profile data with `useProfile()`, wire follower/following counts, wire Edit Profile dialog to `useUpdateProfile()`
- Modify `src/components/AppLayout.tsx` — wire FAB to `openPostEditor()`, wire notification bell to `useNotifications()` unreadCount badge, wire bell click to mark all read

**Verify:** `grep -q 'useProfile' src/pages/ProfilePage.tsx && grep -q 'useNotifications' src/components/AppLayout.tsx`

#### Step 8 — Build verification

**Verify:** `npm run build`

**Gate:** Full CRUD on posts. Can like, comment, bookmark, follow/unfollow. Notification bell shows real unread count.

---

### Phase 4 — Real-Time, Uploads, Clubs

**Goal:** File uploads, real-time DMs, live session chat, and clubs wired to real data.

#### Step 1 — Upload hook

Create `src/hooks/useUpload.ts`:
- `useUpload()` — returns `{ upload(file, options), progress, isUploading }`
- Compresses images using `browser-image-compression` (max 1MB, max 1200px) before upload
- `options` accepts `bucket`, `folder`, `maxSizeMB`, `maxWidthOrHeight`
- Returns public URL on success

**Verify:** `test -f src/hooks/useUpload.ts`

#### Step 2 — AvatarUpload component and Profile wiring

- Create `src/components/shared/AvatarUpload.tsx` — uses `react-dropzone` + `useUpload('avatars')`, calls `updateProfile({ avatar_url })` on success, shows upload progress overlay
- Modify `src/pages/ProfilePage.tsx` — replace static avatar with `AvatarUpload` component

**Verify:** `test -f src/components/shared/AvatarUpload.tsx && grep -q 'AvatarUpload' src/pages/ProfilePage.tsx`

#### Step 3 — Real-time DMs

Create `src/hooks/useMessages.ts`:
- `useMessages(conversationId)` — fetches messages joined with sender profile, subscribes to Realtime INSERT on `messages` filtered by `conversation_id`, appends new messages to state
- `useSendMessage()` — inserts into `messages`, updates `conversation_participants.last_read_at`
- Clean up Realtime channel in `useEffect` return

Modify `src/pages/ChatPage.tsx` (or DM equivalent):
- Replace mock messages with `useMessages(conversationId)`
- Wire send button to `useSendMessage()`

**Verify:** `test -f src/hooks/useMessages.ts && grep -q 'useMessages' src/pages/ChatPage.tsx`

#### Step 4 — Live session chat

Create `src/hooks/useLiveChat.ts`:
- `useLiveChat(sessionId)` — fetches initial chat messages, subscribes to Realtime INSERT on `live_chat_messages` filtered by `session_id`, tracks viewer count via Supabase Presence on channel `live:<sessionId>`
- `sendMessage(content)` — inserts into `live_chat_messages`
- Returns `{ messages, viewerCount, sendMessage }`
- Cleans up both channels in `useEffect` return

Modify `src/pages/LivePage.tsx` (or live session page):
- Replace mock chat and viewer count with `useLiveChat(sessionId)`
- Wire chat input send button to `sendMessage`

**Verify:** `test -f src/hooks/useLiveChat.ts && grep -q 'useLiveChat' src/pages/LivePage.tsx`

#### Step 5 — Clubs

Create `src/hooks/useClubs.ts`:
- `useClubs()` — fetches all public clubs joined with member count
- `useClub(clubId)` — fetches a single club with current book and members
- `useClubMembership(clubId)` — checks if current user is a member
- `useJoinClub()` — inserts into `club_members`, calls `increment_club_members` RPC
- `useLeaveClub()` — deletes from `club_members`
- `useClubDiscussions(clubId)` — fetches discussions for a club

Modify clubs page:
- Replace mock clubs with `useClubs()` hook
- Wire Join/Leave button to `useJoinClub()` / `useLeaveClub()`

**Verify:** `test -f src/hooks/useClubs.ts && grep -q 'useClubs' src/pages/ClubsPage.tsx`

#### Step 6 — Post image upload

Modify `src/components/community/PostEditor.tsx`:
- Add image attachment via `react-dropzone` + `useUpload('post-images')`
- Upload images before submitting post, attach URLs to `image_urls` field

**Verify:** `grep -q 'useUpload' src/components/community/PostEditor.tsx`

#### Step 7 — Final build verification

**Verify:** `npm run build`

**Gate:** Avatar uploads work. DMs update in real time. Live chat shows viewer count. Clubs can be joined/left.

---

## Key File Map

| File | Action |
|---|---|
| `SUPABASE_STEPS.md` | Create (Phase 1, Step 0) |
| `src/lib/supabase.ts` | Create |
| `src/types/database.ts` | Create (placeholder, regenerate after schema) |
| `src/store/authStore.ts` | Create |
| `src/store/uiStore.ts` | Create |
| `src/pages/LoginPage.tsx` | Create |
| `src/pages/RegisterPage.tsx` | Create |
| `src/pages/AuthCallbackPage.tsx` | Create |
| `src/components/auth/ProtectedRoute.tsx` | Create |
| `src/services/books.ts` | Create |
| `src/hooks/useBooks.ts` | Create |
| `src/hooks/useReadingProgress.ts` | Create |
| `src/hooks/usePosts.ts` | Create |
| `src/hooks/useProfile.ts` | Create |
| `src/hooks/useNotifications.ts` | Create |
| `src/hooks/useUpload.ts` | Create |
| `src/hooks/useMessages.ts` | Create |
| `src/hooks/useLiveChat.ts` | Create |
| `src/hooks/useClubs.ts` | Create |
| `src/components/books/AddToShelfButton.tsx` | Create |
| `src/components/books/ProgressUpdater.tsx` | Create |
| `src/components/shared/BookCover.tsx` | Create |
| `src/components/shared/AvatarUpload.tsx` | Create |
| `src/components/community/LikeButton.tsx` | Create |
| `src/components/community/PostEditor.tsx` | Create |
| `src/components/profile/FollowButton.tsx` | Create |
| `src/App.tsx` | Modify |
| `src/components/AppLayout.tsx` | Modify |
| `src/pages/MyBooksPage.tsx` | Modify |
| `src/pages/CommunityPage.tsx` | Modify |
| `src/pages/ProfilePage.tsx` | Modify |
| `src/pages/ChatPage.tsx` | Modify |
| `src/pages/LivePage.tsx` | Modify |
| `src/pages/ClubsPage.tsx` | Modify |
| `.env.local` | Create (never commit) |
| `vercel.json` | Create |

---

## Database Schema

All tables live in Supabase (PostgreSQL). Full SQL is in `SUPABASE_STEPS.md` (generated in Phase 1, Step 0). Key tables:

- `profiles` — extends `auth.users`, auto-created via trigger on signup
- `books` — local cache of book data from Google Books API, has `search_vector` tsvector column
- `user_books` — junction table linking users to books with shelf status and progress
- `posts`, `post_likes`, `post_comments`, `post_bookmarks` — social feed
- `follows` — social graph
- `clubs`, `club_members`, `club_discussions` — reading clubs
- `live_sessions`, `live_chat_messages` — live reading sessions
- `conversations`, `conversation_participants`, `messages` — direct messages
- `notifications` — in-app alerts triggered by database functions
- `reading_sessions` — per-day reading logs for streak tracking

RLS is enabled on every table. Users can only read/write their own data. Public posts and profiles are readable by everyone.

---

## Coding Conventions

- All Supabase queries go inside React Query `queryFn` callbacks — never in component bodies directly
- Every mutation must call `queryClient.invalidateQueries(...)` on success to keep UI in sync
- Use `useAuthStore()` from Zustand to get `user`, `session`, `profile` — never access `supabase.auth` directly in components
- All forms use React Hook Form + Zod for validation
- File uploads always go through the `useUpload()` hook — never call `supabase.storage` directly in components
- Realtime subscriptions must be cleaned up in the `useEffect` return: `return () => { supabase.removeChannel(channel) }`
- Never hardcode user IDs — always use `user.id` from `useAuthStore()`
- Query keys follow the pattern: `['entity']` for lists, `['entity', id]` for single items

---

## External Services

**BookNest uses one external API beyond Supabase:**

### Google Books API
- Base URL: `https://www.googleapis.com/books/v1`
- Key env var: `VITE_GOOGLE_BOOKS_API_KEY`
- Used in `src/services/books.ts` for book search and metadata
- Books found via the API are upserted into the local `books` table (`onConflict: 'google_books_id'`) so they only need to be fetched once
- No npm package needed — use native `fetch`

---

## Environment Variables

`.env.local` (never commit):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

---

## Realtime Pattern

```ts
useEffect(() => {
  const channel = supabase
    .channel('unique-channel-name')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'table_name',
      filter: `column=eq.${value}`
    }, (payload) => {
      // handle new row
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [dependency])
```

## Presence Pattern (viewer count)

```ts
const channel = supabase.channel(`live:${sessionId}`, {
  config: { presence: { key: user.id } }
})
channel
  .on('presence', { event: 'sync' }, () => {
    setViewerCount(Object.keys(channel.presenceState()).length)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') await channel.track({ user_id: user.id })
  })
```

## Supabase Query Pattern

```ts
// Read
const { data, error } = await supabase
  .from('table')
  .select('*, related_table(col1, col2)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// Write
const { data, error } = await supabase
  .from('table')
  .insert({ ...fields })
  .select()
  .single()

// Upsert
await supabase.from('table').upsert(data, { onConflict: 'unique_column' })

// RPC
await supabase.rpc('function_name', { param1: value1 })
```

---

## Deployment

```bash
npm install -g vercel
vercel
```

Add `vercel.json` at the project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Set all three env vars in the Vercel dashboard under Project Settings → Environment Variables.

---

## Do Not

- Do not commit `.env.local`
- Do not call Supabase directly inside JSX render — always use hooks
- Do not use `localStorage` or `sessionStorage` for auth state — Supabase handles it
- Do not skip RLS — every table must have row level security enabled before going live
- Do not use the service role key on the frontend — it bypasses RLS entirely
- Do not skip the build verification step at the end of each phase
- Do not fetch data with raw `useEffect` — always use TanStack Query hooks
