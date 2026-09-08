import type { TestCaseVersion } from '@/types/domain';
import { nanoid } from '@/lib/nanoid';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'smoke' | 'regression' | 'mobile' | 'accessibility';
  build: () => Omit<TestCaseVersion, 'id' | 'createdAt'>[];
}

function step(action: string, expected: string): TestCaseVersion['steps'][number] {
  return { id: nanoid(), action, expected };
}

function v(
  title: string,
  description: string,
  preconditions: string,
  steps: TestCaseVersion['steps'],
): Omit<TestCaseVersion, 'id' | 'createdAt'> {
  return {
    source: 'manual',
    title,
    description,
    preconditions,
    priority: 'Alta',
    tags: ['template'],
    environment: 'homologação',
    mode: 'video',
    verdict: 'NEEDS_REVIEW',
    steps,
  };
}

export const TEMPLATES: Template[] = [
  {
    id: 'smoke-login',
    name: 'Smoke · Login',
    description: 'Bateria mínima de autenticação.',
    category: 'smoke',
    build: () => [
      v(
        'Validar login com credenciais válidas',
        'Garante que o usuário consegue entrar no sistema.',
        'Usuário cadastrado e ativo.',
        [
          step('Acessar a tela de login.', 'Formulário de login é exibido.'),
          step('Preencher email válido.', 'Campo aceita o valor.'),
          step('Preencher senha válida.', 'Campo aceita o valor.'),
          step('Clicar em Entrar.', 'Usuário é redirecionado para a home autenticada.'),
        ],
      ),
      v(
        'Bloquear login com senha incorreta',
        'Garante que senhas erradas são rejeitadas.',
        'Usuário cadastrado e ativo.',
        [
          step('Acessar a tela de login.', 'Formulário é exibido.'),
          step('Preencher credenciais com senha incorreta.', 'Formulário aceita valores.'),
          step('Clicar em Entrar.', 'Mensagem de erro é exibida sem expor se o email existe.'),
        ],
      ),
      v(
        'Bloquear login com campos vazios',
        'Garante validação de campos obrigatórios.',
        'Tela de login acessível.',
        [
          step('Acessar a tela de login.', 'Formulário é exibido.'),
          step('Clicar em Entrar sem preencher campos.', 'Mensagens de validação aparecem em cada campo.'),
        ],
      ),
    ],
  },
  {
    id: 'smoke-navigation',
    name: 'Smoke · Navegação principal',
    description: 'Caminhos críticos do menu.',
    category: 'smoke',
    build: () => [
      v(
        'Validar acesso aos itens do menu principal',
        'Garante que todos os itens de menu carregam.',
        'Usuário autenticado.',
        [
          step('Acessar a home autenticada.', 'Menu principal é exibido.'),
          step('Clicar em cada item do menu sequencialmente.', 'Cada tela carrega sem erro 500.'),
        ],
      ),
    ],
  },
  {
    id: 'regression-forms',
    name: 'Regressão · Formulários',
    description: 'Cobertura ampla de inputs.',
    category: 'regression',
    build: () => [
      v(
        'Validar limites de caracteres em campo de texto',
        'Garante que campos longos não quebram o layout.',
        'Formulário com campo texto.',
        [
          step('Colar texto com 10.000 caracteres no campo.', 'Campo aceita ou trunca com aviso.'),
          step('Verificar UI.', 'Sem overflow horizontal, sem travar scroll.'),
        ],
      ),
      v(
        'Validar comportamento com caracteres especiais',
        'Garante que UTF-8 e caracteres de escape funcionam.',
        'Formulário com campo texto.',
        [
          step('Digitar "João & Maria <teste>".', 'Campo aceita sem erro de validação.'),
          step('Submeter e verificar persistência.', 'Dados salvos preservam caracteres originais.'),
        ],
      ),
    ],
  },
  {
    id: 'mobile-touch',
    name: 'Mobile · Gestos e toque',
    description: 'Interações touch em viewport pequeno.',
    category: 'mobile',
    build: () => [
      v(
        'Validar swipe para fechar modal',
        'Garante que gestos básicos funcionam em mobile.',
        'Acessar via smartphone em viewport < 768px.',
        [
          step('Abrir um modal.', 'Modal aparece em sheet inferior.'),
          step('Realizar swipe para baixo.', 'Modal fecha.'),
        ],
      ),
    ],
  },
  {
    id: 'a11y-keyboard',
    name: 'Acessibilidade · Navegação por teclado',
    description: 'Cobertura de uso sem mouse.',
    category: 'accessibility',
    build: () => [
      v(
        'Validar navegação completa via Tab',
        'Garante que toda a UI é acessível por teclado.',
        'Página carregada em qualquer estado.',
        [
          step('Pressionar Tab repetidamente do início da página.', 'Foco percorre todos os controles interativos em ordem lógica.'),
          step('Verificar foco visível.', 'Cada elemento focado tem indicador visual claro.'),
          step('Pressionar Enter em botão primário.', 'Ação esperada é executada.'),
        ],
      ),
      v(
        'Validar fechamento de modal com Escape',
        'Garante atalho padrão de teclado.',
        'Modal aberto.',
        [
          step('Pressionar Escape.', 'Modal fecha e foco volta ao elemento que o abriu.'),
        ],
      ),
    ],
  },
];
