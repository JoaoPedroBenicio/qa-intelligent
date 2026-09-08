import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import { persistedRecord } from '@/lib/storage';
import { createMigrations } from '@/lib/migrations';

type Theme = 'light' | 'dark';

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  copilotOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleCopilot: () => void;
  setCopilot: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      copilotOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
      setCopilot: (open) => set({ copilotOpen: open }),
    }),
    {
      name: STORAGE_KEYS.ui,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: createMigrations({}),
      merge: (persisted, current) => {
        const saved = persistedRecord(persisted);
        return {
          ...current,
          theme: saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : current.theme,
          sidebarOpen: typeof saved.sidebarOpen === 'boolean' ? saved.sidebarOpen : current.sidebarOpen,
          copilotOpen: typeof saved.copilotOpen === 'boolean' ? saved.copilotOpen : current.copilotOpen,
        };
      },
      partialize: (s) => ({
        sidebarOpen: s.sidebarOpen,
        theme: s.theme,
        copilotOpen: s.copilotOpen,
      }),
    },
  ),
);
