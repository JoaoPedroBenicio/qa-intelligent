import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from './conversationStore';

describe('conversationStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useConversationStore.setState({ conversations: [], activeId: null });
  });

  it('creates a new conversation and activates it', () => {
    const id = useConversationStore.getState().createConversation();
    const state = useConversationStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.activeId).toBe(id);
    expect(state.conversations[0]?.messages).toHaveLength(0);
  });

  it('adds a message and updates timestamp', async () => {
    const id = useConversationStore.getState().createConversation();
    const before = useConversationStore.getState().conversations[0]!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    useConversationStore.getState().addMessage(id, {
      role: 'user',
      text: 'olá',
    });
    const conv = useConversationStore.getState().conversations[0]!;
    expect(conv.messages).toHaveLength(1);
    expect(conv.messages[0]?.text).toBe('olá');
    expect(conv.updatedAt).not.toBe(before);
  });

  it('toggles pin with timestamp', async () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().togglePin(id);
    expect(useConversationStore.getState().conversations[0]?.pinned).toBe(true);
    expect(useConversationStore.getState().conversations[0]?.pinnedAt).not.toBeNull();
    useConversationStore.getState().togglePin(id);
    expect(useConversationStore.getState().conversations[0]?.pinned).toBe(false);
    expect(useConversationStore.getState().conversations[0]?.pinnedAt).toBeNull();
  });

  it('deletes and clears active if it was active', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().deleteConversation(id);
    expect(useConversationStore.getState().conversations).toHaveLength(0);
    expect(useConversationStore.getState().activeId).toBeNull();
  });

  it('keeps active when deleting another conversation', () => {
    const a = useConversationStore.getState().createConversation();
    const b = useConversationStore.getState().createConversation();
    expect(useConversationStore.getState().activeId).toBe(b);
    useConversationStore.getState().deleteConversation(a);
    expect(useConversationStore.getState().activeId).toBe(b);
  });
});


it('does not hydrate malformed conversations or replace store actions', async () => {
  useConversationStore.setState({ conversations: [] });
  localStorage.setItem('qa-fluxo:conversations', JSON.stringify({ version: 1, state: { conversations: null, createConversation: 'invalid' } }));
  await useConversationStore.persist.rehydrate();
  expect(useConversationStore.getState().conversations).toEqual([]);
  expect(typeof useConversationStore.getState().createConversation).toBe('function');
});
