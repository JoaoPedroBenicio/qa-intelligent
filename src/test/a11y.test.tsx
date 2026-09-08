import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';

function expectNoViolations(
  results: Awaited<ReturnType<typeof axe>>,
): void {
  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description}\n  nodes: ${v.nodes
            .map((n) => n.target.join(' '))
            .join(', ')}`,
      )
      .join('\n');
    throw new Error(`Accessibility violations:\n${summary}`);
  }
  expect(results.violations).toHaveLength(0);
}

describe('a11y smoke', () => {
  it('Button has no detectable violations', async () => {
    const { container } = render(<Button>Ação</Button>);
    expectNoViolations(await axe(container));
  });

  it('Input with label has no detectable violations', async () => {
    const { container } = render(<Input id="x" label="Campo" />);
    expectNoViolations(await axe(container));
  });

  it('Modal with title and description has no detectable violations', async () => {
    const { container } = render(
      <Modal open onClose={() => {}} title="Título" description="Descrição">
        <p>conteúdo</p>
      </Modal>,
    );
    expectNoViolations(await axe(container));
  });
});
