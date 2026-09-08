import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';

describe('projectStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useProjectStore.setState({ projects: [], folders: [], activeProjectId: null });
  });

  it('creates a project and makes it active', () => {
    const id = useProjectStore.getState().createProject('Checkout');
    expect(useProjectStore.getState().activeProjectId).toBe(id);
    expect(useProjectStore.getState().projects[0]?.name).toBe('Checkout');
  });

  it('renames a project', () => {
    const id = useProjectStore.getState().createProject('Old');
    useProjectStore.getState().renameProject(id, 'New');
    expect(useProjectStore.getState().projects[0]?.name).toBe('New');
  });

  it('creates nested folders', () => {
    const projectId = useProjectStore.getState().createProject('P1');
    const folderId = useProjectStore.getState().createFolder('Epic', projectId);
    const subId = useProjectStore.getState().createFolder('Feature A', projectId, folderId);
    const folders = useProjectStore.getState().folders;
    expect(folders).toHaveLength(2);
    expect(folders.find((f) => f.id === subId)?.parentId).toBe(folderId);
  });

  it('deletes folder and its children', () => {
    const projectId = useProjectStore.getState().createProject('P1');
    const folderId = useProjectStore.getState().createFolder('Epic', projectId);
    useProjectStore.getState().createFolder('Sub', projectId, folderId);
    useProjectStore.getState().deleteFolder(folderId);
    expect(useProjectStore.getState().folders).toHaveLength(0);
  });
});


describe('project relationships', () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: [], folders: [], activeProjectId: null });
    useConversationStore.setState({ conversations: [], activeId: null });
    useTestCaseStore.setState({ testCases: [], selectedId: null });
  });

  it('uses an existing active project for new conversations', () => {
    const projectId = useProjectStore.getState().createProject('QA');
    useConversationStore.getState().createConversation();
    expect(useConversationStore.getState().conversations[0]?.projectId).toBe(projectId);
  });

  it('creates a real default project when creating the first conversation', () => {
    useConversationStore.getState().createConversation();
    const projectId = useConversationStore.getState().conversations[0]?.projectId;
    expect(useProjectStore.getState().projects.some((p) => p.id === projectId)).toBe(true);
  });

  it('removes every folder descendant and moves its conversations to the root', () => {
    const p = useProjectStore.getState().createProject('QA');
    const root = useProjectStore.getState().createFolder('Root', p);
    const child = useProjectStore.getState().createFolder('Child', p, root);
    const leaf = useProjectStore.getState().createFolder('Leaf', p, child);
    const conv = useConversationStore.getState().createConversation();
    useConversationStore.getState().updateConversation(conv, (c) => ({ ...c, folderId: leaf }));
    useProjectStore.getState().deleteFolder(root);
    expect(useProjectStore.getState().folders).toEqual([]);
    expect(useConversationStore.getState().conversations[0]?.folderId).toBeNull();
  });

  it('deletes project contents and selects the next project', () => {
    const other = useProjectStore.getState().createProject('Keep');
    const deleted = useProjectStore.getState().createProject('Delete');
    useProjectStore.getState().createFolder('Folder', deleted);
    useConversationStore.getState().createConversation();
    useProjectStore.getState().deleteProject(deleted);
    expect(useProjectStore.getState().folders).toEqual([]);
    expect(useProjectStore.getState().activeProjectId).toBe(other);
    expect(useConversationStore.getState().conversations).toEqual([]);
    expect(useConversationStore.getState().activeId).toBeNull();
  });
});


it('does not hydrate malformed projects or replace store actions', async () => {
  useProjectStore.setState({ projects: [] });
  localStorage.setItem('qa-fluxo:projects', JSON.stringify({ version: 1, state: { projects: null, createProject: 'invalid' } }));
  await useProjectStore.persist.rehydrate();
  expect(useProjectStore.getState().projects).toEqual([]);
  expect(typeof useProjectStore.getState().createProject).toBe('function');
});
