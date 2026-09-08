import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from '@/lib/nanoid';
import { STORAGE_KEYS } from '@/lib/constants';
import { createMigrations } from '@/lib/migrations';
import { persistedRecord, readPersistedRecords } from '@/lib/storage';
import { StoredTestCaseSchema } from '@/types/domain';
import type { TestCase, TestCaseVersion, Verdict, Priority } from '@/types/domain';

interface TestCaseState {
  testCases: TestCase[];
  selectedId: string | null;
  setSelected: (id: string | null) => void;
  createFromVersion: (params: {
    projectId: string;
    folderId: string | null;
    version: Omit<TestCaseVersion, 'id' | 'createdAt'>;
  }) => string;
  applyVersion: (testCaseId: string, version: Omit<TestCaseVersion, 'id' | 'createdAt'>) => void;
  updateVerdict: (testCaseId: string, verdict: Verdict) => void;
  updatePriority: (testCaseId: string, priority: Priority) => void;
  updateStep: (
    testCaseId: string,
    stepId: string,
    field: 'action' | 'expected',
    value: string,
  ) => void;
  updateTitle: (testCaseId: string, title: string) => void;
  deleteTestCase: (testCaseId: string) => void;
}

function currentVersion(tc: TestCase): TestCaseVersion {
  const found = tc.versions.find((v) => v.id === tc.currentVersionId);
  return found ?? tc.versions[tc.versions.length - 1]!;
}

function patchCurrent(
  tc: TestCase,
  patch: (v: TestCaseVersion) => TestCaseVersion,
): TestCase {
  const version = currentVersion(tc);
  return {
    ...tc,
    currentVersionId: version.id,
    updatedAt: new Date().toISOString(),
    versions: tc.versions.map((v) =>
      v.id === version.id ? patch(v) : v,
    ),
  };
}

export const useTestCaseStore = create<TestCaseState>()(
  persist(
    (set) => ({
      testCases: [],
      selectedId: null,

      setSelected: (id) => set({ selectedId: id }),

      createFromVersion: ({ projectId, folderId, version }) => {
        const testCaseId = nanoid();
        const versionId = nanoid();
        const now = new Date().toISOString();
        const fullVersion: TestCaseVersion = {
          ...version,
          id: versionId,
          createdAt: now,
        };
        const tc: TestCase = {
          id: testCaseId,
          currentVersionId: versionId,
          versions: [fullVersion],
          folderId,
          projectId,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ testCases: [tc, ...s.testCases], selectedId: testCaseId }));
        return testCaseId;
      },

      applyVersion: (testCaseId, version) => {
        const versionId = nanoid();
        const now = new Date().toISOString();
        const fullVersion: TestCaseVersion = {
          ...version,
          id: versionId,
          createdAt: now,
        };
        set((s) => ({
          testCases: s.testCases.map((tc) =>
            tc.id === testCaseId
              ? {
                  ...tc,
                  currentVersionId: versionId,
                  versions: [...tc.versions, fullVersion],
                  updatedAt: now,
                }
              : tc,
          ),
        }));
      },

      updateVerdict: (testCaseId, verdict) =>
        set((s) => ({
          testCases: s.testCases.map((tc) =>
            tc.id === testCaseId ? patchCurrent(tc, (v) => ({ ...v, verdict })) : tc,
          ),
        })),

      updatePriority: (testCaseId, priority) =>
        set((s) => ({
          testCases: s.testCases.map((tc) =>
            tc.id === testCaseId ? patchCurrent(tc, (v) => ({ ...v, priority })) : tc,
          ),
        })),

      updateStep: (testCaseId, stepId, field, value) =>
        set((s) => ({
          testCases: s.testCases.map((tc) =>
            tc.id === testCaseId
              ? patchCurrent(tc, (v) => ({
                  ...v,
                  steps: v.steps.map((step) =>
                    step.id === stepId ? { ...step, [field]: value } : step,
                  ),
                }))
              : tc,
          ),
        })),

      updateTitle: (testCaseId, title) =>
        set((s) => ({
          testCases: s.testCases.map((tc) =>
            tc.id === testCaseId ? patchCurrent(tc, (v) => ({ ...v, title })) : tc,
          ),
        })),

      deleteTestCase: (testCaseId) =>
        set((s) => ({
          testCases: s.testCases.filter((tc) => tc.id !== testCaseId),
          selectedId: s.selectedId === testCaseId ? null : s.selectedId,
        })),
    }),
    {
      name: STORAGE_KEYS.testCases,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: createMigrations({}),
      partialize: (s) => ({ testCases: s.testCases, selectedId: s.selectedId }),
      merge: (persisted, current) => {
        const saved = persistedRecord(persisted);
        const testCases = readPersistedRecords(STORAGE_KEYS.testCases, persisted, 'testCases', StoredTestCaseSchema, current.testCases);
        const selectedId = saved.selectedId === undefined ? current.selectedId : saved.selectedId;
        return { ...current, testCases, selectedId: testCases.some((tc) => tc.id === selectedId) ? selectedId as string : null };
      },
    },
  ),
);

export { currentVersion };
