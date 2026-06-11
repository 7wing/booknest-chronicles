import { create } from 'zustand'

interface UIState {
  isPostEditorOpen: boolean
  isMobileNavOpen: boolean
  openPostEditor: () => void
  closePostEditor: () => void
  toggleMobileNav: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isPostEditorOpen: false,
  isMobileNavOpen: false,

  openPostEditor: () => set({ isPostEditorOpen: true }),
  closePostEditor: () => set({ isPostEditorOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
}))