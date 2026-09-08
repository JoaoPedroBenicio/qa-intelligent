import { describe, it, expect, beforeEach } from 'vitest';
import { useTestCaseStore, currentVersion } from './testCaseStore';
import { TestCaseSchema } from '@/types/domain';

const baseVersion = {
  source: 'manual' as const,
  title: 'Test',
  description: '',
  preconditions: '',
  priority: 'Alta' as const,
  tags: [],
  environment: 'homologação',
  mode: 'video' as const,
  verdict: 'PASS' as const,
  steps: [
    { id: '00000000-0000-4000-8000-000000000010', action: 'a', expected: 'b' },
  ],
  spec: '',
};

describe('testCaseStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useTestCaseStore.setState({ testCases: [], selectedId: null });
  });

  it('creates a test case with one version', () => {
    const id = useTestCaseStore.getState().createFromVersion({
      projectId: 'p1',
      folderId: null,
      version: baseVersion,
    });
    const state = useTestCaseStore.getState();
    expect(state.testCases).toHaveLength(1);
    expect(state.selectedId).toBe(id);
    expect(state.testCases[0]?.versions).toHaveLength(1);
  });

  it('updates verdict on current version', () => {
    const id = useTestCaseStore.getState().createFromVersion({
      projectId: 'p1',
      folderId: null,
      version: baseVersion,
    });
    useTestCaseStore.getState().updateVerdict(id, 'FAIL');
    const tc = useTestCaseStore.getState().testCases[0]!;
    expect(currentVersion(tc).verdict).toBe('FAIL');
  });

  it('adds new version via applyVersion', () => {
    const id = useTestCaseStore.getState().createFromVersion({
      projectId: 'p1',
      folderId: null,
      version: baseVersion,
    });
    useTestCaseStore.getState().applyVersion(id, {
      ...baseVersion,
      title: 'Atualizado',
    });
    const tc = useTestCaseStore.getState().testCases[0]!;
    expect(tc.versions).toHaveLength(2);
    expect(currentVersion(tc).title).toBe('Atualizado');
  });

  it('updates a single step field without affecting others', () => {
    const id = useTestCaseStore.getState().createFromVersion({
      projectId: 'p1',
      folderId: null,
      version: {
        ...baseVersion,
        steps: [
          { id: '00000000-0000-4000-8000-000000000010', action: 'old', expected: 'old' },
          { id: '00000000-0000-4000-8000-000000000011', action: 'second', expected: 'second' },
        ],
      },
    });
    useTestCaseStore
      .getState()
      .updateStep(id, '00000000-0000-4000-8000-000000000010', 'action', 'new');
    const tc = useTestCaseStore.getState().testCases[0]!;
    const v = currentVersion(tc);
    expect(v.steps[0]?.action).toBe('new');
    expect(v.steps[1]?.action).toBe('second');
  });

  it('deletes and clears selection', () => {
    const id = useTestCaseStore.getState().createFromVersion({
      projectId: 'p1',
      folderId: null,
      version: baseVersion,
    });
    useTestCaseStore.getState().deleteTestCase(id);
    expect(useTestCaseStore.getState().testCases).toHaveLength(0);
    expect(useTestCaseStore.getState().selectedId).toBeNull();
  });
});


describe('persisted test case integrity', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useTestCaseStore.setState({ testCases: [], selectedId: null });
  });

  const create = () => useTestCaseStore.getState().createFromVersion({
    projectId: '00000000-0000-4000-8000-000000000020', folderId: null, version: baseVersion,
  });

  it('rejects an absent current version in the domain schema', () => {
    create();
    const tc = useTestCaseStore.getState().testCases[0]!;
    expect(TestCaseSchema.safeParse({ ...tc, currentVersionId: '00000000-0000-4000-8000-000000000030' }).success).toBe(false);
  });

  it('edits the displayed fallback version and repairs its pointer', () => {
    const id = create();
    const tc = useTestCaseStore.getState().testCases[0]!;
    useTestCaseStore.setState({ testCases: [{ ...tc, currentVersionId: 'missing' }] });
    useTestCaseStore.getState().updateTitle(id, 'Updated');
    const updated = useTestCaseStore.getState().testCases[0]!;
    expect(currentVersion(updated).title).toBe('Updated');
    expect(updated.currentVersionId).toBe(tc.versions[0]!.id);
  });

  it('retains valid records while quarantining invalid persisted records', async () => {
    const id = create();
    const valid = useTestCaseStore.getState().testCases[0]!;
    const saved = { testCases: [valid, { id: 'broken' }], selectedId: 'missing', updateTitle: 'broken' };
    localStorage.setItem('qa-fluxo:test-cases', JSON.stringify({ state: saved, version: 1 }));
    await useTestCaseStore.persist.rehydrate();
    expect(useTestCaseStore.getState().testCases.map((tc) => tc.id)).toEqual([id]);
    expect(useTestCaseStore.getState().selectedId).toBeNull();
    expect(typeof useTestCaseStore.getState().updateTitle).toBe('function');
    expect(JSON.parse(localStorage.getItem('qa-fluxo:test-cases:recovery')!)).toEqual(saved);
  });

  it('ignores invalid collection shapes while retaining usable runtime state', async () => {
    const id = create();
    localStorage.setItem('qa-fluxo:test-cases', JSON.stringify({ state: { testCases: null }, version: 1 }));
    await useTestCaseStore.persist.rehydrate();
    expect(useTestCaseStore.getState().testCases.map((tc) => tc.id)).toEqual([id]);
  });
});


it('preserves editable drafts and legacy identifiers across reloads', async () => {
  const id = useTestCaseStore.getState().createFromVersion({ projectId: 'legacy-project', folderId: null, version: baseVersion });
  const tc = useTestCaseStore.getState().testCases.find((item) => item.id === id)!;
  useTestCaseStore.setState({ testCases: [{ ...tc, id: 'legacy-case', currentVersionId: 'stale', versions: tc.versions.map((v) => ({ ...v, title: '', steps: v.steps.map((s) => ({ ...s, action: '' })) })) }] });
  await useTestCaseStore.persist.rehydrate();
  const draft = useTestCaseStore.getState().testCases[0]!;
  expect(draft?.id).toBe('legacy-case');
  expect(currentVersion(draft).title).toBe('');
  expect(currentVersion(draft).steps[0]?.action).toBe('');
  expect(draft.currentVersionId).toBe(tc.currentVersionId);
});
