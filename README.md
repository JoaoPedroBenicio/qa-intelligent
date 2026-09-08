# QA Fluxo

> Da tela para os testes em 30 segundos.

Ferramenta de QA que transforma gravações de tela + voz em casos de teste editáveis.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (tokens semânticos, dark mode via `class`)
- Zustand (estado global) · Zod (validação)
- lucide-react (ícones) · sonner (toasts) · framer-motion (animações)
- Vitest + Testing Library (testes)

## Scripts

```bash
npm install          # instala dependências
npm run dev          # dev server em http://localhost:5173
npm run build        # build de produção
npm run preview      # preview do build
npm run lint         # ESLint (inclui jsx-a11y)
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run validate     # lint + typecheck + test (CI local)
```

## Estrutura

```
src/
├── features/            # vertical slices
│   ├── conversations/   # chat + sidebar
│   ├── test-cases/      # editor + diff + csv
│   ├── ai-copilot/      # sidebar IA
│   └── video-capture/   # MediaRecorder
├── components/          # primitives compartilhados (Button, Modal, etc)
├── lib/                 # cn, sanitize, storage, format
├── stores/              # zustand stores
├── types/               # domain + zod schemas
├── styles/              # globals.css + tokens.css
└── test/                # setup de testes
```

## Estado atual

**Fase 0 — Fundação técnica** ✅

- Projeto Vite + React + TS rodando
- Tailwind build com tokens semânticos (`bg-surface`, `text-verdict-pass`, etc)
- 4 primitives: Button, Input, Modal, Toast
- Domínio tipado com Zod (`TestCase`, `Conversation`, `Project`, `Folder`)
- Persistência localStorage com fallback seguro
- Suíte de testes: primitives + sanitize + storage + csv + schemas
- ESLint + Prettier + jsx-a11y

**Próximas fases:** ver `PLAN.md` (se existir) ou issues do repositório.
