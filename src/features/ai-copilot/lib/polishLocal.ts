import type { TestCaseVersion } from '@/types/domain';
import { ACTIVE_MODE } from '@/lib/constants';

const DEFAULT_EXPECTED_BY_KEYWORD: Array<{ pattern: RegExp; expected: string }> = [
  {
    pattern: /clic|abrir|selecionar/i,
    expected: 'O componente correspondente deve ser exibido com todas as opções habilitadas.',
  },
  {
    pattern: /preencher|digitar|informar/i,
    expected: 'Os campos do formulário devem refletir os dados inseridos e validar as regras de entrada.',
  },
  {
    pattern: /exportar|baixar/i,
    expected: 'A mensagem de sucesso deve ser apresentada e o link de download habilitado.',
  },
  {
    pattern: /filtrar/i,
    expected: 'A lista deve exibir somente os itens que correspondem ao filtro aplicado.',
  },
  {
    pattern: /excluir|remover|deletar/i,
    expected: 'O item deve ser removido da lista e a confirmação de sucesso deve aparecer.',
  },
];

function guessExpected(action: string): string {
  for (const kw of DEFAULT_EXPECTED_BY_KEYWORD) {
    if (kw.pattern.test(action)) return kw.expected;
  }
  return 'O sistema deve processar a solicitação e atualizar o componente visual correspondente.';
}

function firstLine(text: string): string {
  const line = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  return line ?? 'Validação do Fluxo de Interface';
}

function remainingLines(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.slice(1);
}

function fallbackSteps(): TestCaseVersion['steps'] {
  return [
    {
      id: crypto.randomUUID(),
      action: 'Acessar a página principal e localizar o componente alvo.',
      expected: 'A tela deve ser carregada com o estado inicial e os controles habilitados.',
    },
  ];
}

export interface PolishInput {
  text: string;
  attachments?: { name: string; size: number; mimeType: string }[];
}

export function polishTestCaseLocally(input: PolishInput): Omit<
  TestCaseVersion,
  'id' | 'createdAt'
> {
  const title = firstLine(input.text);
  const rawSteps = remainingLines(input.text);
  const hasAttachments = (input.attachments?.length ?? 0) > 0;

  const steps =
    rawSteps.length === 0
      ? hasAttachments
        ? deriveStepsFromAttachment(input.attachments![0]!.name)
        : fallbackSteps()
      : rawSteps.slice(0, 11).map((line) => ({
          id: crypto.randomUUID(),
          action: line,
          expected: guessExpected(line),
        }));

  const tags: string[] = [ACTIVE_MODE];
  if (hasAttachments) tags.push('with-evidence');

  return {
    source: 'ai-polished',
    title: title.startsWith('Validar') ? title : `Validar ${title.toLowerCase()}`,
    description: `Validar se o fluxo "${title}" executa todas as etapas esperadas, mantendo consistência dos dados e do comportamento dos componentes visuais.`,
    preconditions:
      'Estar autenticado na aplicação com perfil administrativo e possuir dados cadastrados para o teste.',
    priority: 'Alta',
    tags,
    environment: 'homologação',
    mode: ACTIVE_MODE,
    verdict: 'NEEDS_REVIEW',
    steps,
  };
}

function deriveStepsFromAttachment(name: string): TestCaseVersion['steps'] {
  const lower = name.toLowerCase();
  if (lower.includes('login')) {
    return [
      {
        id: crypto.randomUUID(),
        action: 'Acessar a tela de login.',
        expected: 'O formulário de login deve ser exibido.',
      },
      {
        id: crypto.randomUUID(),
        action: 'Preencher credenciais válidas e submeter.',
        expected: 'O usuário deve ser autenticado e redirecionado para a home.',
      },
    ];
  }
  return [
    {
      id: crypto.randomUUID(),
      action: `Analisar o conteúdo de "${name}".`,
      expected: 'As ações visíveis no vídeo devem corresponder aos passos documentados.',
    },
  ];
}
