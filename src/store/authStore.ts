import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  header_url: string | null
  reading_goal: number | null
  streak_days: number | null
  last_read_at: string | null
  is_public: boolean | null
  location: string | null
  website: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signInWithGithub: () => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
  fetchProfile: (userId: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data && !error) {
      set({ profile: data as Profile })
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  },

  signInWithGithub: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  },

  signUp: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (error) {
      return { error: error as Error | null }
    }

    // Fallback: manually insert profile row (in case trigger doesn't fire)
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        display_name: username,
        is_public: true,
      })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    return { error: error as Error | null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  updateProfile: async (data: Partial<Profile>) => {
    const { user } = get()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error && data) {
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...data } : null,
      }))
    }

    return { error: error as Error | null }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ session, user: session.user, isLoading: true })
        await get().fetchProfile(session.user.id)
      }
      
      set({ isLoading: false })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ isLoading: false })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null })

      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },
}))