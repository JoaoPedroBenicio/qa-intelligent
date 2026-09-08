import type { TestCaseVersion } from '@/types/domain';

export type FieldChange = {
  field: string;
  before: unknown;
  after: unknown;
  kind: 'added' | 'removed' | 'changed' | 'unchanged';
};

const TRACKED_FIELDS: Array<{ key: keyof TestCaseVersion; label: string }> = [
  { key: 'title', label: 'Título' },
  { key: 'description', label: 'Descrição' },
  { key: 'preconditions', label: 'Pré-condições' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'verdict', label: 'Veredito' },
  { key: 'environment', label: 'Ambiente' },
];

export function diffFields(
  before: TestCaseVersion,
  after: TestCaseVersion,
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const { key, label } of TRACKED_FIELDS) {
    const a = before[key];
    const b = after[key];
    const same = JSON.stringify(a) === JSON.stringify(b);
    out.push({
      field: label,
      before: a,
      after: b,
      kind: same ? 'unchanged' : 'changed',
    });
  }
  return out;
}

export interface StepChange {
  index: number;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  beforeAction?: string;
  beforeExpected?: string;
  afterAction?: string;
  afterExpected?: string;
}

export function diffSteps(before: TestCaseVersion, after: TestCaseVersion): StepChange[] {
  const max = Math.max(before.steps.length, after.steps.length);
  const changes: StepChange[] = [];
  for (let i = 0; i < max; i++) {
    const b = before.steps[i];
    const a = after.steps[i];
    if (b && !a) {
      changes.push({
        index: i,
        status: 'removed',
        beforeAction: b.action,
        beforeExpected: b.expected,
      });
    } else if (!b && a) {
      changes.push({
        index: i,
        status: 'added',
        afterAction: a.action,
        afterExpected: a.expected,
      });
    } else if (b && a) {
      const sameAction = b.action === a.action;
      const sameExpected = b.expected === a.expected;
      changes.push({
        index: i,
        status: sameAction && sameExpected ? 'unchanged' : 'changed',
        beforeAction: b.action,
        beforeExpected: b.expected,
        afterAction: a.action,
        afterExpected: a.expected,
      });
    }
  }
  return changes;
}

export interface VersionDiff {
  fields: FieldChange[];
  steps: StepChange[];
  tags: { added: string[]; removed: string[] };
}

export function diffVersions(before: TestCaseVersion, after: TestCaseVersion): VersionDiff {
  const beforeTags = new Set(before.tags);
  const afterTags = new Set(after.tags);
  const tags = {
    added: [...afterTags].filter((t) => !beforeTags.has(t)),
    removed: [...beforeTags].filter((t) => !afterTags.has(t)),
  };
  return {
    fields: diffFields(before, after),
    steps: diffSteps(before, after),
    tags,
  };
}
