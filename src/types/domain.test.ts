import { describe, it, expect } from 'vitest';
import {
  VerdictSchema,
  TestCaseStepSchema,
  TestCaseVersionSchema,
  TestCaseSchema,
} from './domain';

describe('domain schemas', () => {
  describe('VerdictSchema', () => {
    it('accepts valid verdicts', () => {
      expect(VerdictSchema.parse('PASS')).toBe('PASS');
      expect(VerdictSchema.parse('FAIL')).toBe('FAIL');
      expect(VerdictSchema.parse('BLOCKED')).toBe('BLOCKED');
      expect(VerdictSchema.parse('NEEDS_REVIEW')).toBe('NEEDS_REVIEW');
    });

    it('rejects invalid verdicts', () => {
      expect(() => VerdictSchema.parse('MAYBE')).toThrow();
    });
  });

  describe('TestCaseStepSchema', () => {
    it('requires non-empty action and expected', () => {
      expect(() =>
        TestCaseStepSchema.parse({
          id: '00000000-0000-4000-8000-000000000001',
          action: '',
          expected: 'ok',
        }),
      ).toThrow();
    });
  });

  describe('TestCaseVersionSchema', () => {
    it('validates full version with defaults', () => {
      const result = TestCaseVersionSchema.parse({
        id: '00000000-0000-4000-8000-000000000001',
        createdAt: '2026-09-01T10:00:00.000Z',
        source: 'manual',
        title: 'Test',
        description: '',
        preconditions: '',
        priority: 'Alta',
        tags: [],
        environment: 'homologação',
        mode: 'video',
        verdict: 'PASS',
        steps: [
          {
            id: '00000000-0000-4000-8000-000000000010',
            action: 'a',
            expected: 'b',
          },
        ],
      });
      expect(result.tags).toEqual([]);
    });

    it('rejects empty steps', () => {
      expect(() =>
        TestCaseVersionSchema.parse({
          id: '00000000-0000-4000-8000-000000000001',
          createdAt: '2026-09-01T10:00:00.000Z',
          source: 'manual',
          title: 'Test',
          description: '',
          preconditions: '',
          priority: 'Alta',
          tags: [],
          environment: 'homologação',
          mode: 'video',
          verdict: 'PASS',
          steps: [],
        }),
      ).toThrow();
    });
  });

  describe('TestCaseSchema', () => {
    it('roundtrips valid test case', () => {
      const input = {
        id: '00000000-0000-4000-8000-000000000100',
        currentVersionId: '00000000-0000-4000-8000-000000000001',
        versions: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            createdAt: '2026-09-01T10:00:00.000Z',
            source: 'manual',
            title: 'Test',
            description: '',
            preconditions: '',
            priority: 'Alta',
            tags: [],
            environment: 'homologação',
            mode: 'video',
            verdict: 'PASS',
            steps: [
              {
                id: '00000000-0000-4000-8000-000000000010',
                action: 'a',
                expected: 'b',
              },
            ],
          },
        ],
        folderId: null,
        projectId: '00000000-0000-4000-8000-000000000200',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };
      expect(TestCaseSchema.parse(input)).toEqual(input);
    });
  });
});
