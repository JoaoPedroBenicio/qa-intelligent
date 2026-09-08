import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from '@/lib/nanoid';
import { STORAGE_KEYS } from '@/lib/constants';
import { createMigrations } from '@/lib/migrations';
import { persistedRecord, readPersistedRecords } from '@/lib/storage';
import { useProjectStore } from '@/stores/projectStore';
import { StoredConversationSchema } from '@/types/domain';
import type { Conversation, ChatMessage, FileAttachment } from '@/types/domain';

interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  setActive: (id: string | null) => void;
  createConversation: () => string;
  updateConversation: (id: string, fn: (c: Conversation) => Conversation) => void;
  deleteConversation: (id: string) => void;
  addMessage: (convId: string, msg: Omit<ChatMessage, 'id' | 'createdAt'>) => string;
  togglePin: (id: string) => void;
  rename: (id: string, title: string) => void;
  attachFile: (convId: string, attachment: FileAttachment) => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      conversations: [],
      activeId: null,

      setActive: (id) => set({ activeId: id }),

      createConversation: () => {
        const projects = useProjectStore.getState();
        let projectId = projects.projects.find((p) => p.id === projects.activeProjectId)?.id
          ?? projects.projects[0]?.id;
        if (!projectId) projectId = projects.createProject('Projeto padrão');
        else projects.setActiveProject(projectId);
        const id = nanoid();
        const conv: Conversation = {
          id,
          projectId,
          folderId: null,
          title: 'Nova conversa',
          pinned: false,
          pinnedAt: null,
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        set((s) => ({ conversations: [conv, ...s.conversations], activeId: id }));
        return id;
      },

      updateConversation: (id, fn) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
        })),

      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),

      addMessage: (convId, msg) => {
        const messageId = nanoid();
        const fullMsg: ChatMessage = {
          ...msg,
          id: messageId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, fullMsg], updatedAt: fullMsg.createdAt }
              : c,
          ),
        }));
        return messageId;
      },

      togglePin: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== id) return c;
            const pinned = !c.pinned;
            return {
              ...c,
              pinned,
              pinnedAt: pinned ? new Date().toISOString() : null,
            };
          }),
        })),

      rename: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c,
          ),
        })),

      attachFile: (convId, attachment) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const lastMsg = c.messages[c.messages.length - 1];
            if (!lastMsg || lastMsg.role !== 'user') return c;
            return {
              ...c,
              messages: [
                ...c.messages.slice(0, -1),
                { ...lastMsg, attachments: [...(lastMsg.attachments ?? []), attachment] },
              ],
            };
          }),
        })),
    }),
    {
      name: STORAGE_KEYS.conversations,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: createMigrations({}),
      partialize: (s) => ({ conversations: s.conversations, activeId: s.activeId }),
      merge: (persisted, current) => {
        const saved = persistedRecord(persisted);
        const conversations = readPersistedRecords(STORAGE_KEYS.conversations, persisted, 'conversations', StoredConversationSchema, current.conversations);
        const activeId = saved.activeId === undefined ? current.activeId : saved.activeId;
        return { ...current, conversations, activeId: conversations.some((c) => c.id === activeId) ? activeId as string : null };
      },
    },
  ),
);
