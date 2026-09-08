import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotPanel } from './CopilotPanel';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';

describe('CopilotPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useConversationStore.setState({ conversations: [], activeId: null });
    useTestCaseStore.setState({ testCases: [], selectedId: null });
  });

  it('stores one user message while processing a request locally', async () => {
    const user = userEvent.setup();
    render(<CopilotPanel projectId="00000000-0000-4000-8000-000000000001" />);

    await user.type(screen.getByLabelText('Descreva o fluxo ou cole um roteiro'), 'Entrar');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(useConversationStore.getState().conversations[0]?.messages).toHaveLength(1);
  });
});
