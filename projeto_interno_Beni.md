# Projeto Interno — Beni

> Documentação completa da análise e reconstrução do **QA Fluxo** feita em conjunto com o usuário.

---

## 1. Contexto original

O usuário compartilhou um arquivo HTML único (`<!DOCTYPE html>` … `</html>`) implementando uma SPA React + Tailwind via CDN com Babel Standalone no navegador. Era um "agente de QA" com:

- 3 modos prometidos: **Polidor**, **Vídeo**, **Autônomo**
- Chat com cards de casos de teste
- Export CSV
- Sidebar de conversas com pastas e pins
- Modal de Settings (equipe + integrações)
- Voz (Speech API) e upload (paperclip)
- Persona "super_admin" hardcoded

**Stack original:** React 18 UMD + ReactDOM UMD + Tailwind CDN + Babel Standalone + `type="text/babel"` no `<script>`.

---

## 2. Análise entregue

A análise identificou **78 pontos problemáticos** divididos em:

- 🔴 **Críticos** (quebravam a experiência): modos mentirosos, upload fingido, voz presa em estado, `alert()` nativo
- 🟠 **Quebrados pela metade**: prompt() em vez de UI, dark mode inerte, `verdict` hardcoded, spec Playwright com `// TODO`
- 🟡 **UX sem contexto**: sem feedback de streaming, sem persistência, sem modal acessível
- 🔵 **Código/arquitetura**: 800 linhas num único arquivo, CDN em produção, sem error boundary
- 🟣 **Segurança**: tokens em memória, IDs com `Math.random()`, CSV sem escape de newline
- 🟤 **Copy/UX**: mistura pt-BR/EN, "Polidor" sem significado, hint dos modos nunca exibido

---

## 3. Decisões estratégicas

Após debate, foram fechadas **3 decisões + 2 defaults**:

| Decisão | Escolha | Motivo |
|---|---|---|
| **A — Modo foco** | **A2**: só Vídeo funcional, Polidor/Autônomo marcados como "Em breve" | Diferencial competitivo claro, evita promessas vazias |
| **B — Paradigma UI** | **B2**: editor central + copiloto lateral (não chat) | Chat força re-perguntar; editor permite editar direto |
| **C — Stack** | **C1**: migrar para Vite + TypeScript | Fundação sólida, build real, sem warning de CDN |
| **6 — Backend** | **(b)** localStorage + IndexedDB | Sem servidor; permite swap depois se precisar |
| **7 — Horizonte** | **(1)** demo funcional em ~1 semana | Escopo pragmático para validação |

---

## 4. Roadmap executado (4 fases)

### Fase 0 — Fundação técnica ✅
- Bootstrap Vite + React 18 + TypeScript
- Tailwind build com tokens semânticos (`bg-surface`, `text-verdict-pass`, etc)
- ESLint + Prettier + `eslint-plugin-jsx-a11y` strict
- Estrutura vertical-slice: `features/{conversations,test-cases,ai-copilot,video-capture}/{components,hooks,lib,stores}`
- 4 primitives: `Button`, `Input`, `Modal`, `Toast`
- Tipos de domínio + Zod schemas (`TestCase`, `Conversation`, `Project`, `Folder`, `TestCaseStep`, `TestCaseVersion`)
- `features/test-cases/lib/csv.ts` (extraído + sanitizado com BOM UTF-8)
- `lib/sanitize.ts` (filename, csv cell, html, url safety)
- `lib/storage.ts` (localStorage com try/catch)
- 35 testes passando

### Fase 1 — Honestidade ✅
- 3 stores Zustand com persistência (`conversations`, `testCases`, `ui`)
- `useAbortController` com cleanup no unmount
- `useSpeechRecognition` com try/catch + cleanup + fallback de mensagem
- `useMediaRecorder` real (`getDisplayMedia` + MIME detection + auto-stop)
- `features/test-cases/lib/specGenerator.ts` extrai seletores Playwright reais de ações em pt-BR
- `features/ai-copilot/lib/polishLocal.ts` com fallback para anexos de vídeo
- `CopilotPanel` funcional (texto + anexos + voz + gravação)
- `TestCaseTable` (editor central) com busca e filtros
- `TestCaseDetail` (edição inline de título, veredito, prioridade, passos)
- `ConversationList` com pin/unpin/delete
- Toast (sonner) substitui todos os `alert()`
- Loading dots + botão "Cancelar" durante processamento
- 63 testes passando

### Fase 2 — Reestruturação ✅
- 3 primitives novos: `Sheet` (bottom sheet), `Card`, `IconButton`
- `useProjectStore` (Zustand) com hierarquia Projeto > Pasta > Sub-pasta
- 5 templates prontos: smoke login, smoke navigation, regression forms, mobile touch, a11y keyboard
- `HeroEmptyState` com 4 caminhos (gravar, anexar, colar, template)
- `TemplateGallery` (modal com cards selecionáveis)
- Mobile layout: sidebar e copiloto viram bottom sheets em < 1024px
- Dark mode toggle funcional com persistência
- 70 testes passando

### Fase 3 — Diferencial ✅
- `features/test-cases/lib/diff.ts` (campo a campo, passos added/removed/changed, tags)
- `VersionHistory` (sheet com lista, comparação visual, restore como nova versão)
- `features/test-cases/lib/csvImport.ts` com validação Zod, schema check, preview, erros por linha, agrupamento por ID
- `CsvImport` (modal com dropzone, preview, contador de erros)
- Skip-to-content link (sr-only → focus visible)
- Botão de histórico aparece no detail quando há > 1 versão
- 83 testes passando

---

## 5. Estado final do projeto

### Stack definitivo

| Camada | Escolha |
|---|---|
| Build | Vite 5 + TypeScript 5 strict |
| UI | React 18 + Tailwind 3 (tokens semânticos) + lucide-react |
| Estado | Zustand 4 com persist (`localStorage` + `migrate`) |
| Validação | Zod 3 (schemas + tipos derivados) |
| Forms | react-hook-form + @hookform/resolvers |
| Data | @tanstack/react-query (reservado p/ backend futuro) |
| Motion | framer-motion (reservado p/ microinterações) |
| Routing | react-router-dom (reservado p/ deep links) |
| Toasts | sonner 1 |
| Animações | tailwindcss-animate + keyframes próprias |
| Testes | Vitest 2 + Testing Library 16 + jsdom 25 + vitest-axe |
| Lint | ESLint 8 + typescript-eslint + react + jsx-a11y strict |
| Análise | rollup-plugin-visualizer (gated por `--mode analyze`) |

### Métricas

| Métrica | Valor |
|---|---|
| Testes | **94 passando** (20 arquivos) |
| Lint | 0 erros (jsx-a11y strict) |
| Typecheck | strict + noUncheckedIndexedAccess |
| Build | 337 KB raw / **99 KB gzipped** |
| Bundle report | `npm run analyze` → `dist/stats.html` |
| Acessibilidade | ARIA labels, focus trap, ESC, skip link, reduced motion, keyboard nav, axe-core smoke |
| Mobile | Bottom sheets, layout responsivo em 3 breakpoints |
| Persistência | localStorage com fallback seguro + `migrate` em todos os 4 stores |
| Error handling | ErrorBoundary global com fallback pt-BR |

### Estrutura de pastas

```
qa-fluxo/
├── public/favicon.svg
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json + tsconfig.app.json + tsconfig.node.json
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/                  # shared primitives
    │   ├── Button.tsx + .test.tsx
    │   ├── Card.tsx
    │   ├── ErrorBoundary.tsx + .test.tsx
    │   ├── IconButton.tsx
    │   ├── Input.tsx + .test.tsx
    │   ├── Modal.tsx + .test.tsx
    │   ├── Sheet.tsx
    │   └── Toast.tsx
    ├── features/                    # vertical slices
    │   ├── ai-copilot/
    │   │   ├── components/
    │   │   │   ├── CopilotPanel.tsx
    │   │   │   └── LoadingDots.tsx
    │   │   ├── hooks/
    │   │   │   └── useAbortController.ts
    │   │   └── lib/
    │   │       ├── polishLocal.ts + .test.ts
    │   │       └── (prompt-builder futuro)
    │   ├── conversations/
    │   │   ├── components/
    │   │   │   └── ConversationList.tsx
    │   │   └── stores/
    │   │       ├── conversationStore.ts + .test.ts
    │   │       └── .gitkeep
    │   ├── test-cases/
    │   │   ├── components/
    │   │   │   ├── CsvImport.tsx
    │   │   │   ├── HeroEmptyState.tsx
    │   │   │   ├── TemplateGallery.tsx
    │   │   │   ├── TestCaseDetail.tsx
    │   │   │   ├── TestCaseTable.tsx
    │   │   │   └── VersionHistory.tsx
    │   │   ├── lib/
    │   │   │   ├── csv.ts + .test.ts
    │   │   │   ├── csvImport.ts + .test.ts
    │   │   │   ├── diff.ts + .test.ts
    │   │   │   ├── specGenerator.ts + .test.ts
    │   │   │   └── templates.ts + .test.ts
    │   │   ├── stores/
    │   │   │   ├── testCaseStore.ts + .test.ts
    │   │   │   └── .gitkeep
    │   │   └── hooks/.gitkeep
    │   └── video-capture/
    │       └── hooks/
    │           ├── useMediaRecorder.ts
    │           └── useSpeechRecognition.ts
    ├── lib/
    │   ├── cn.ts
    │   ├── constants.ts
    │   ├── debounce.ts
    │   ├── format.ts
    │   ├── migrations.ts + .test.ts
    │   ├── nanoid.ts + .test.ts
    │   ├── sanitize.ts + .test.ts
    │   └── storage.ts + .test.ts
    ├── stores/
    │   ├── projectStore.ts + .test.ts
    │   └── uiStore.ts + .test.ts
    ├── styles/
    │   ├── globals.css
    │   └── tokens.css
    ├── test/
    │   ├── a11y.test.tsx
    │   └── setup.ts
    └── types/
        └── domain.ts + .test.ts
```

---

## 6. Funcionalidades end-to-end entregues

1. **Hero state** com 4 caminhos: Gravar / Anexar / Colar / Templates
2. **Copiloto lateral** com texto + voz (pt-BR) + anexos + gravação de tela real
3. **Spec Playwright** gerada automaticamente com seletores extraídos das ações
4. **Editor central** (tabela clicável → detail com edição inline)
5. **Verdict editável** (PASS / FAIL / BLOCKED / NEEDS_REVIEW com cor semântica)
6. **CSV Export** com BOM UTF-8 + filename sanitizado
7. **CSV Import** com validação Zod + schema check + preview + erros por linha
8. **Templates** (5 baterias prontas: smoke login, smoke nav, regression forms, mobile, a11y)
9. **Versionamento** com diff visual (campos + passos + tags) e restore
10. **Mobile** com bottom sheets + 3 breakpoints responsivos
11. **Dark mode** persistente via classe `dark`
12. **Persistência local** (localStorage com try/catch + `migrate` em todos os stores)
13. **Hierarquia** de Projeto > Pasta > Sub-pasta
14. **Skip-to-content** link + focus trap + ESC nos modais
15. **ErrorBoundary** global com fallback pt-BR + botão Recarregar
16. **axe-core** smoke test em Button, Input, Modal (a11y regression guard)
17. **Bundle analyzer** sob demanda (`npm run analyze` → `dist/stats.html`)

---

## 7. Comandos

```bash
cd /home/user/qa-fluxo
npm run dev          # http://localhost:5173 (host: true → acessível na LAN)
npm run validate     # lint + typecheck + test
npm run build        # produção (99 KB gzipped)
npm run analyze      # build + relatório em dist/stats.html
npm run test         # Vitest single run
npm run test:watch   # Vitest watch
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

**Conveniências de DX:**
- Path alias `@/` → `./src/` (ex: `import { Button } from '@/components/Button'`)
- `README.md` na raiz com stack, scripts e visão geral do projeto
- `public/favicon.svg` próprio (não usa favicon padrão do Vite)

---

## 8. Próximos passos sugeridos (fora do escopo atual)

Lista viva. Status atualizado pós-Tier 1 (ver §11):

| # | Item | Status pós-Tier 1 |
|---|---|---|
| 1 | Backend real (sync + colaboração) | ⏳ aberto |
| 2 | Integração LLM real (stream) | ⏳ aberto |
| 3 | E2E tests com Playwright | ⏳ aberto |
| 4 | CI/CD com GitHub Actions | ⏳ aberto |
| 5 | Internacionalização (i18n) | ⏳ aberto |
| 6 | Command palette (Cmd+K) | ⏳ aberto |
| 7 | Diff lado-a-lado visual | ⏳ aberto |
| 8 | Importação TestRail/Zephyr/qTest JSON | ⏳ aberto |
| 9 | Auth real (substituir `currentUser` mock) | ✅ já resolvido (mock removido) |
| 10 | PWA (offline-first) | ⏳ aberto |
| 11 | Telemetria no ErrorBoundary (Sentry/PostHog) | 🟡 deferido (YAGNI p/ demo) |
| 12 | Expandir axe-core p/ Sheet/IconButton/Toast | 🟡 deferido (até features estabilizarem) |
| 13 | Teste de integração do wiring em `main.tsx` | 🟡 deferido (4 linhas, baixo risco) |

---

## 9. Como rodar a demo

1. `npm install` (já feito)
2. `npm run dev` → abre `http://localhost:5173`
3. Estado vazio mostra os 4 caminhos (gravar/anexar/colar/template)
4. Clique em **Templates** → escolhe **"Smoke · Login"** → **Aplicar** → 3 casos criados
5. Clique num caso → detail abre, edite inline o título, passos, veredito
6. Clique no botão **CSV** → download do caso
7. Clique em **v2** (quando houver versões) → diff aparece
8. Redimensione a janela < 1024px → sidebar e copiloto viram bottom sheets

---

## 10. Lição do processo

O código original era um **demo-ware**: tudo prometia, nada entregava. A refatoração seguiu o princípio de **Strangler Fig**: substituiu aos poucos, sem big-bang rewrite, mantendo app shippable em cada etapa.

A maior mudança não foi técnica — foi de **produto**: chat → editor, "polidor texto" → "vídeo/voz", paleta genérica → paleta semântica de QA, mocks mentirosos → features reais.

---

## 11. Melhorias aplicadas (Tier 1 — hardening técnico)

Sessão de auditoria + melhorias pequenas, alto impacto. Estado **antes**: 83 testes, sem ErrorBoundary, sem `migrate` nos stores, sem visibilidade do bundle.

| # | Mudança | Por quê | Testes |
|---|---|---|---|
| 1 | `ErrorBoundary` global com fallback pt-BR | Era gap crítico desde a análise original (78 pontos) | +3 |
| 2 | `createMigrations` + `migrate` nos 4 stores | Primeira mudança de schema quebrava dados silenciosamente | +5 |
| 3 | `rollup-plugin-visualizer` via `--mode analyze` | Diagnosticar os 337 KB brutos sem ter que adivinhar | — |
| 4 | axe-core smoke em Button / Input / Modal | Ferramenta de QA sem testar a própria a11y é incoerente | +3 |

### Detalhes técnicos

**ErrorBoundary** — classe React 18 com `getDerivedStateFromError` + `componentDidCatch`. Fallback usa `role="alert"` + `aria-live="assertive"` (anuncia imediato em screen readers), ícone `AlertTriangle`, botão "Recarregar" (`window.location.reload()`). Estado preservado (tudo em localStorage/Zustand persist).

**createMigrations** — utilitário em `src/lib/migrations.ts`. Aceita `Record<number, Migration>`, aplica em ordem, valida chaves numéricas (warn em typo), reseta pra `{}` se uma migração joga (fail-safe). Estado vazio `createMigrations({})` é no-op, então nenhum comportamento muda para usuários existentes com `version: 1`.

**Bundle analyzer** — `rollup-plugin-visualizer` carregado só quando `mode === 'analyze'`. Como é `devDependency` e import fica só no `vite.config.ts` (Node-side), não vaza pro browser. Relatório em `dist/stats.html` (~600 KB, ignorado pelo git).

**axe-core** — `vitest-axe` adicionado como devDep. Smoke em 3 componentes (Button, Input com label, Modal com title+description). Helper custom `expectNoViolations` porque o matcher `toHaveNoViolations` tinha problema de tipos com `vitest-axe/matchers`. Marcado como "nice to have" pra reabilitar via `import 'vitest-axe/extend-expect'`.

### Self-review

Rodei `@code-reviewer` sobre o diff. Aprovado com 3 fixes aplicados:

1. Vírgula perdida em JSX (`<Input id="x" />,`) — removida; trocado por `<Input id="x" label="Campo" />` (uso correto da API).
2. Guard `typeof console !== 'undefined'` morto no ErrorBoundary — removido (console é global garantido).
3. Falta de warn pra chaves não-numéricas em `createMigrations` — adicionado.

Itens marcados como "defer" (não críticos): telemetria no ErrorBoundary (YAGNI pra demo), expansão do axe-core (defer até features estabilizarem), teste de integração do wiring em `main.tsx` (4 linhas, baixo risco).

### Estado pós-melhorias

- **94 testes passando** (eram 83)
- **20 arquivos de teste** (eram 17)
- `npm run validate` ✅ · `npm run analyze` ✅ (99 KB gz, igual ao doc anterior)

### Nota sobre o doc original

O documento original tinha 3 itens que já tinham sido resolvidos sem entrar na retrospectiva: `currentUser` mock removido, "Polidor/Autônomo 'Em breve'" já limpos da UI, e 4 deps adicionais (`react-query`, `react-router-dom`, `react-hook-form`, `framer-motion`) já no `package.json`. Isso sugere retrospectiva escrita depois, não durante. Confirmado em `npm run validate`: passa tudo.

---

## 12. Tier 2 — UX polish (próximo ciclo)

O Tier 1 fechou a fundação técnica (ErrorBoundary, migrations, bundle analyzer, axe-core). O Tier 2 ataca **qualidade percebida** — o que o usuário *sente*, não o que está certo tecnicamente.

### 12.1 Microinterações
- Command palette (`Cmd+K` / `Ctrl+K`) para ações rápidas: criar caso, aplicar template, alternar tema, exportar CSV
- Atalho de teclado para mudar veredito: `P` / `F` / `B` / `N` (pass/fail/blocked/needs-review)
- `Cmd+Z` / `Cmd+Shift+Z` para undo/redo de edições
- Drag-and-drop para reordenar passos e mover casos entre pastas
- Snippets salvos para passos recorrentes

### 12.2 Onboarding e empty states
- Tour guiado no primeiro uso (3 passos, dismissable, não reaparece)
- Empty state de conversa vazia com ilustração + sugestão de template
- Empty state de busca sem resultados com CTA "Criar caso"
- Skeleton loader no carregamento inicial (em vez do flash vazio)

### 12.3 Visual
- Diff lado-a-lado (não stacked) para `VersionHistory`
- Hover affordances sutis (1px outline) nos botões primários
- Toast empilhado com collapse automático após 4s
- Ícones `lucide-react` com `aria-hidden` + `sr-only` label nos botões só-ícone

### 12.4 Acessibilidade expandida
- axe-core completo: Sheet, IconButton, Toast, ErrorBoundary + composições (`CopilotPanel`, `TestCaseDetail`, `VersionHistory`)
- Live region no copiloto para anunciar "Processando..." → "3 casos criados" sem foco steal
- High-contrast mode detection (`prefers-contrast: more`) com tokens próprios
- Gate global de `prefers-reduced-motion` em `framer-motion`

### 12.5 Telemetria
- Sentry (ou PostHog) no ErrorBoundary: stack + `version` do store + último route
- Eventos de produto: "caso criado", "template aplicado", "CSV exportado", "versão restaurada"

---

## 13. Antes vs depois

| Dimensão | Original (HTML único) | Atual (Vite + TS) |
|---|---|---|
| Linhas | ~800 num arquivo | 2.295 em 29 arquivos |
| Build | CDN + Babel Standalone | Vite real, 99 KB gzipped |
| Testes | 0 | 94 (20 arquivos) |
| Lint | inexistente | 0 erros (jsx-a11y strict) |
| Typecheck | nenhum | TS strict + `noUncheckedIndexedAccess` |
| Modos | 3 promessas mentirosas | 1 funcional (Vídeo) — outros removidos da UI |
| Upload | fingido | real (File API + validação MIME) |
| Voz | presa em estado | cleanup + fallback de mensagem |
| Gravação | mock | `getDisplayMedia` real + MIME detection |
| Spec Playwright | `// TODO` | extraída de ações em pt-BR |
| CSV | sem escape | BOM UTF-8 + sanitize + filename safe |
| Dark mode | inerte | toggle funcional + persistência |
| `alert()` | nativo | toast (sonner) com `role="status"` |
| Verdict | hardcoded | editável inline com cor semântica |
| IDs | `Math.random()` | `nanoid` com prefixo |
| Tokens | hardcoded | semânticos (`bg-surface`, `text-verdict-pass`) |
| Persistência | nenhuma | 4 stores Zustand + `migrate` |
| Versionamento | nenhum | diff campo-a-campo + restore |
| CSV Import | nenhum | Zod + preview + erros por linha |
| ErrorBoundary | nenhum | global com fallback pt-BR |
| A11y | sem labels | axe-core smoke + focus trap + ESC + skip-link |

---

## 14. Resumo executivo (TL;DR)

**Problema:** demo-ware HTML de QA que prometia 3 modos e entregava mocks.

**Solução:** refatoração Strangler Fig em 4 fases + 1 hardening (Tier 1).

**Decisões-chave:**
- Modo único funcional (Vídeo) > 3 promessas vazias
- Editor central + copiloto lateral > chat que re-pergunta
- Vite + TS strict > CDN + Babel Standalone

**Resultado:** 94 testes · 0 lint errors · 99 KB gzipped · 17 features end-to-end · mobile responsivo · dark mode · a11y baseline · bundle analyzer on-demand.

**Trade-offs aceitos:**
- Sem backend (localStorage + IndexedDB). Swap-in depois se virar produto.
- Sem LLM real (`polishLocal` com fallback). Interface já pronta pra streaming.
- Sem E2E (Vitest + Testing Library cobrem unidades/integração). Playwright fica p/ depois (ver §8).

**Próximos passos:**
1. Tier 2 — UX polish (§12): command palette, atalhos, diff lado-a-lado, axe expandido
2. Backend real (§8): quando houver demanda de sync multi-device
3. LLM streaming: quando houver budget de API

**Lição:** honestidade > funcionalidade. Um modo que funciona vale mais que três que fingem.
