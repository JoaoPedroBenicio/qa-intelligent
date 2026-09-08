import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from '@/lib/nanoid';
import { STORAGE_KEYS } from '@/lib/constants';
import { createMigrations } from '@/lib/migrations';
import { persistedRecord, readPersistedRecords } from '@/lib/storage';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';
import { StoredProjectSchema, StoredFolderSchema } from '@/types/domain';
import type { Project, Folder } from '@/types/domain';

interface ProjectState {
  projects: Project[];
  folders: Folder[];
  activeProjectId: string | null;
  setActiveProject: (id: string) => void;
  createProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  createFolder: (name: string, projectId: string, parentId?: string | null) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      folders: [],
      activeProjectId: null,

      setActiveProject: (id) => set({ activeProjectId: id }),

      createProject: (name) => {
        const id = nanoid();
        const project: Project = { id, name, description: '' };
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: id,
          folders: s.folders.filter((f) => f.projectId !== id),
        }));
        return id;
      },

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      deleteProject: (id) => {
        if (!get().projects.some((p) => p.id === id)) return;
        useConversationStore.setState((s) => {
          const conversations = s.conversations.filter((c) => c.projectId !== id);
          return { conversations, activeId: conversations.some((c) => c.id === s.activeId) ? s.activeId : null };
        });
        useTestCaseStore.setState((s) => {
          const testCases = s.testCases.filter((tc) => tc.projectId !== id);
          return { testCases, selectedId: testCases.some((tc) => tc.id === s.selectedId) ? s.selectedId : null };
        });
        set((s) => {
          const projects = s.projects.filter((p) => p.id !== id);
          return {
            projects,
            folders: s.folders.filter((f) => f.projectId !== id),
            activeProjectId: s.activeProjectId === id ? projects[0]?.id ?? null : s.activeProjectId,
          };
        });
      },

      createFolder: (name, projectId, parentId = null) => {
        const id = nanoid();
        const folder: Folder = { id, name, parentId, projectId };
        set((s) => ({ folders: [...s.folders, folder] }));
        return id;
      },

      renameFolder: (id, name) =>
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),

      deleteFolder: (id) => {
        const folders = get().folders;
        if (!folders.some((f) => f.id === id)) return;
        const removed = new Set([id]);
        let previousSize = 0;
        while (removed.size !== previousSize) {
          previousSize = removed.size;
          for (const folder of folders) {
            if (folder.parentId && removed.has(folder.parentId)) removed.add(folder.id);
          }
        }
        useConversationStore.setState((s) => ({
          conversations: s.conversations.map((c) => c.folderId && removed.has(c.folderId) ? { ...c, folderId: null } : c),
        }));
        useTestCaseStore.setState((s) => ({
          testCases: s.testCases.map((tc) => tc.folderId && removed.has(tc.folderId) ? { ...tc, folderId: null } : tc),
        }));
        set({ folders: folders.filter((f) => !removed.has(f.id)) });
      },
    }),
    {
      name: STORAGE_KEYS.projects,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: createMigrations({}),
      partialize: (s) => ({ projects: s.projects, folders: s.folders, activeProjectId: s.activeProjectId }),
      merge: (persisted, current) => {
        const saved = persistedRecord(persisted);
        const projects = readPersistedRecords(STORAGE_KEYS.projects, persisted, 'projects', StoredProjectSchema, current.projects);
        const folders = readPersistedRecords(STORAGE_KEYS.projects, persisted, 'folders', StoredFolderSchema, current.folders);
        const activeProjectId = saved.activeProjectId === undefined ? current.activeProjectId : saved.activeProjectId;
        return { ...current, projects, folders, activeProjectId: projects.some((p) => p.id === activeProjectId) ? activeProjectId as string : projects[0]?.id ?? null };
      },
    },
  ),
);
