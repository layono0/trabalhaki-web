# Trabalhaki Empresas — Portal Web

Portal web oficial para empresas contratantes e equipes de recrutamento da plataforma **Trabalhaki**, integrado em tempo real à API REST (`trabalhaki-backend`) e ao aplicativo mobile dos candidatos (`trabalhaki-frontend`).

[![React](https://img.shields.io/badge/React-19.1-393BE7?style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-393BE7?style=flat-square)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-12152E?style=flat-square)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-8%20testes%20aprovados-0F6B3A?style=flat-square)](https://vitest.dev/)

---

## Repositórios do Ecossistema Trabalhaki

| Módulo | Tecnologia | Repositório |
|---|---|---|
| **Portal Web (Empresas)** | React 19 + TypeScript + Vite | [`layono0/trabalhaki-web`](https://github.com/layono0/trabalhaki-web) |
| **Aplicativo Mobile (Candidatos)** | Flutter + Dart | [`layono0/trabalhaki-frontend`](https://github.com/layono0/trabalhaki-frontend) |
| **API REST e Regras de Negócio** | Java 21 + Spring Boot 4.1 | [`layono0/trabalhaki-backend`](https://github.com/layono0/trabalhaki-backend) |

---

## Principais Funcionalidades

- **Landing Page Institucional com Demonstração Interativa:** apresentação da proposta de valor, prévia jogável de triagem de candidatos, transparência dos 5 critérios do algoritmo de compatibilidade (0–100 pontos) e tabela de planos (Gratuito e Premium).
- **Autenticação Empresarial Segura (`/login` e `/cadastro`):** cadastro de empresa com validação estrutural de CNPJ (14 dígitos), login via JWT + Refresh Token e bloqueio automático de contas de candidatos no portal empresarial.
- **Gestão Completa de Vagas (`/painel/vagas`):** criação, edição em drawer organizado por seções, pausa, reativação e encerramento definitivo de vagas, respeitando o limite de 3 vagas ativas no Plano Gratuito.
- **Triagem de Candidatos por Swipe (`/painel/swipe`):** fila exclusiva de profissionais que já curtiram a vaga no aplicativo mobile, ordenados por score de compatibilidade explicado, com suporte a arraste, atalhos de teclado (`←`, `→`, `Ctrl+Z`), desfazer descarte e modal de celebração de match.
- **Matches, Chat Pós-Match e Etapas Seletivas (`/painel/chat`):** a empresa inicia a conversa com templates rápidos, consulta o registro preservado do perfil no momento do match e registra avanços de etapa (`Em análise`, `Entrevista`, `Aprovado`, `Reprovado`) com histórico auditável.
- **Perfil Institucional e Equipe (`/painel/empresa`):** edição de dados da empresa, upload de logotipo (PNG/JPEG/WEBP até 3 MB) e gestão de membros (`Administrador` e `Recrutador`).

---

## Arquitetura e Estrutura de Pastas

```text
trabalhaki-web/
├── index.html                        # Carregamento de fontes (Plus Jakarta Sans / JetBrains Mono)
├── package.json                      # Scripts e dependências
└── src/
    ├── App.tsx                       # Rotas públicas e protegidas
    ├── index.css                     # Tokens do Design System (DESIGN.md), responsividade e skeletons
    ├── components/
    │   ├── BrandMark.tsx             # Marca oficial Trabalhaki + TriageIcon autoral
    │   ├── CandidateDetailDrawer.tsx # Detalhamento completo do perfil e score
    │   ├── CandidateSwipeCard.tsx    # Cartão interativo de triagem por gestos
    │   ├── DashboardLayout.tsx       # Shell responsivo com sidebar e contadores ao vivo
    │   ├── JobFormDrawer.tsx         # Formulário de vaga em 4 seções
    │   └── MatchCelebrationModal.tsx # Modal de match sincronizado com o app Flutter
    ├── context/
    │   └── AuthContext.tsx           # Estado global de sessão e renovação JWT
    ├── hooks/
    │   └── useDialogA11y.ts          # Acessibilidade de modais/drawers (Escape, backdrop, foco)
    ├── pages/
    │   ├── LandingPage.tsx
    │   ├── AuthPage.tsx
    │   ├── JobsPage.tsx
    │   ├── CandidateSwipePage.tsx
    │   ├── ChatPage.tsx
    │   └── CompanyProfilePage.tsx
    ├── services/
    │   └── api.ts                    # Cliente HTTP tipado com refresh automático
    ├── types/api.ts                  # Contratos TypeScript alinhados aos DTOs Spring Boot
    ├── utils/                        # Validação de CNPJ, formatadores e constantes (UFs, planos)
    └── test/portal.test.tsx          # Suíte de testes de integração de interface (Vitest + RTL)
```

---

## Como Executar Localmente

### Pré-requisitos
- Node.js 20+ e npm
- Back-end `trabalhaki-backend` em execução em `http://localhost:8080`

### Instalação e Execução

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (http://localhost:5173)
npm run dev

# 3. Executar testes automatizados
npm test -- --run

# 4. Gerar build de produção (verificação TypeScript + bundle Vite)
npm run build
```

> Em modo de desenvolvimento (`import.meta.env.DEV`), a tela de login exibe um seletor opcional da URL da API e preenchimento rápido da conta demonstrativa (`empresa@trabalhaki.com`). Esses controles são automaticamente ocultados no build de produção.

---

## Qualidade, Acessibilidade e Testes

- **Conformidade WCAG AA:** contraste mínimo de 4,5:1 em textos, placeholders (`#5B6482`) e indicadores financeiros (`#0F6B3A`), navegação por teclado (`Escape`, `Tab` trap e retorno de foco em drawers/modais) e `aria-label` em todos os botões de ícone.
- **Responsividade Mobile (390px+):** header simplificado sem overflow horizontal na landing, marca no topo mobile de login e alternância fluida entre lista e conversa no chat mobile.
- **Suíte Automatizada:** 8 testes de fluxo completo com Vitest e React Testing Library cobrindo landing interativa, bloqueio de candidato no login, validação de CNPJ, swipe/pass/undo/match, chat pós-match, criação de vaga, gestão de equipe e acessibilidade de drawers.
