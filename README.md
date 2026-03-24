# SisVac 2.0 - Sistema de Gestão de Férias e Afastamentos (Governo do AM)

Bem-vindo ao repositório do **SisVac2**, uma arquitetura focada na resolução complexa de regras de negócio estaduais, com foco em segurança de dados (Ownership RBAC), emissão nativa de PDF em RAM e Banco de Dados Real-time.

![GitHub Action CI](https://github.com/[seu-usuario]/[nome-do-repo]/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## 🏗️ A Arquitetura (O que resolvemos)
O objetivo desta aplicação é ir muito além de um CRUD. A meta foi traduzir o rigor fiscal da **Lei 1.762 Estadual do Amazonas de 1986** em algoritmos blindados de TypeScipt (NestJS) conversando ativamente com os modernos *Server Components* do React servidos pelo Next.js.

### 💼 Destaques Técnicos para Recrutadores (Market-Ready)
1. **Frontend Otimizado (Next.js App Router):** Fluxos dinâmicos (`Server Actions`) e validação via `auth()` plugados direto em Views Nativas do PostgreSQL (Supabase), eliminando *loading states* longos nas telas do Painel Funcional.
2. **Backend Interceptador (NestJS Fastify):** Lidera Módulos rigorosos de concessão de Férias e Aprovações Governamentais.
   - **Ownership Guards (`IDOR Prevention`):** Impedem matematicamente que servidores cancelem Férias que pertençam ao `ID` de outras pessoas manipulando o Payload da URL.
   - **Audit Trail:** Cada deleção ou aprovação injeta tracking in-memory apontando o histórico de quem causou a ação ao Tribunal de Contas (TCE).
3. **Engine PDF Nativa (Low Overhead RAM):** Gerador integrado de guias oficiais A4 com vetores, poupando a nuvem (*Railway*) de baixar `+300MB` de Chromium (*Puppeteer*), e desenhando de graça as Assinaturas de Chefia online via *Streams Vetoriais Bufferizadas* (`pdfkit`).
4. **TDD / Qualidade de Automação (Jest):** Contém *Mocks in-RAM* isolados que testam agressivamente se é possível violar as regras de *contabilidade das férias* ou passar Status falsos durante a requisição, garantindo Zero Regressões.
5. **Integração Contínua (CI/CD DevOps):** GitHub Actions configurado com `.yml` para acionar toda arvore topológica de testes do *Turborepo* (Build Web, Build backend e Mocks de Jest) a cada `Push` em Master, antes de permitir a esteira do *Deploy Contínuo Automágico*.

---

## 🚀 Entendendo o Monorepo e Stack
Nós dividimos a inteligência do ecossistema usando o orquestrador **Turborepo** para aceleração de dependências por Cache:
- 💻 **`apps/web`**: Next.js 14, TailwindCSS UI Livre, Auth.js v5 (Deploy: **Vercel**).
- ⚙️ **`apps/api`**: NestJS HTTP Fastify Adapter API, Serviços de PDF, Regras da Lei 1.762 e Jest Runner (Deploy: **Railway**).
- 🧬 **`packages/types`**: Tipos globais e DTOs cruzados; para que tanto Web quanto API conversem usando o mesmo esqueleto sem clonagem de código. Base para Single Source of Truth do Supabase RLS.

---

## 💻 Para Executar Localmente na sua Máquina

1. Certifique-se de que a Node Engine `>=20.0.0` está instalada.
2. Digite no terminal raiz: `npm i` (Baixará todas as dependências em todas as pastas juntas de uma vez).
3. Instancie no projeto as variáveis em arquivos secretos `.env`:
4. Conclua executando `npm run dev` na raiz para levantar o Server Frontend da Ana, e o Server API do NestJS paralelamente.

```bash
# Executar a Pipeline de Testes Oficiais em sua máquina
npm run test
```

> **Desenvolvido com o máximo zelo de Performance de Nuvem e TDD. Idealizado para avaliação Enterprise.**

O sistema está online e disponível para testes. Para facilitar a avaliação das regras de negócio e do Controle de Acesso Baseado em Perfis (RBAC), disponibilizamos contas de demonstração.

> ⚠️ **Aviso de Privacidade e Segurança:** > Para garantir a integridade da demonstração, o banco de dados é **limpo e recriado automaticamente todos os dias** durante a madrugada. Fique à vontade para criar cadastros, aprovar solicitações e testar todas as funcionalidades!

Acesse o sistema por aqui: **[🔗 https://sisvac.vercel.app/]**


### 👤 Acesso de Demonstração (Portfólio)
Para testar a aplicação sem precisar se cadastrar, utilize as credenciais abaixo. 
*(Nota: Por segurança e privacidade, o banco de dados é limpo e recriado automaticamente todos os dias).*

### 🏢 1. Perfil: Gestor de RH
Tem visão gerencial do sistema. Responsável por administrar o quadro de funcionários e avaliar os pedidos.
- **E-mail:** `rh@sisvac.com`
- **Senha:** `sisvac123`
- **O que testar:** Cadastrar novos servidores, visualizar a tabela geral de solicitações, e Aprovar/Negar férias pendentes.

### 👤 2. Perfil: Servidor Comum
Visão restrita do funcionário. Acessa apenas seus próprios dados funcionais.
- **E-mail:** `servidor@sisvac.com`
- **Senha:** `sisvac123`
- **O que testar:** Visualizar o próprio saldo de férias (dias disponíveis/utilizados) e abrir uma nova solicitação de férias!