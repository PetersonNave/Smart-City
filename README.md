# ResolveAí - App Mobile de Gestão de Demandas Urbanas

Bem-vindos ao repositório do app mobile da Plataforma de Gestão de Demandas Urbanas! Este projeto é o cliente **mobile** (Expo / React Native) do mesmo produto ResolveAí cuja versão web centraliza o registro, acompanhamento e gestão de solicitações públicas (como buracos em vias, iluminação e saneamento), conectando cidadãos e gestores públicos.

Este repositório contém apenas o front-end mobile. Ele consome a **mesma API** (Flask) utilizada pela aplicação web — o back-end é compartilhado entre os dois clientes e deve ser executado a partir do seu próprio repositório.

## 1 Tecnologias Utilizadas

* **Framework:** Expo (React Native) com TypeScript
* **Navegação:** Expo Router (rotas por arquivo em `/app`; `Stack.Protected` separa as telas de visitante e de usuário logado; abas com a tab bar customizada do Figma)
* **Estilização:** [NativeWind](https://www.nativewind.dev) v4 (Tailwind CSS v3) nas telas e componentes refinados (Início, Perfil, Painel do Gestor, cards, cabeçalhos, avisos), com o restante em StyleSheet. Cores e fontes do Figma ficam em um só lugar, `src/theme/tokens.json`, lido tanto pelo `tailwind.config.js` (classes como `bg-primary`, `text-navy`, `font-inter-bold`, `rounded-card`) quanto pelo tema TypeScript (`src/theme`)
* **Gerenciamento de Estado global:** Context API (`src/auth/AuthContext.tsx`, o *auth store*: sessão, usuário e perfil) e Zustand (`src/stores/demandStore.ts`: lista de demandas, filtros, paginação e cache por id, compartilhados entre lista, detalhe, edição e criação)
* **Perfis:** Cidadão (registra e acompanha as próprias demandas) e Gestor Público (vê todas, altera o status). O perfil vem da API (`role`) e é exibido na Home e na aba Perfil
* **Formulários:** react-hook-form + zod
* **Notificações:** `expo-notifications` — o cidadão é avisado quando o gestor muda o status de uma demanda sua (push remoto via backend; notificação local como alternativa no Expo Go)
* **Painel do gestor:** indicadores operacionais (total, status, categoria, região, tempo médio de atendimento) em `GET /api/demandas/metricas`
* **Build:** EAS Build (`eas.json`), APK para Android pelo perfil `preview`
* **Recursos do aparelho:** `expo-camera` (câmera do app para fotografar a demanda), `expo-image-picker` (foto da galeria) e `expo-location` (endereço via GPS)
* **Dados:** Integração com o back-end Flask (mesma API consumida pela aplicação web)

## 2 Como rodar o projeto localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento na sua máquina.

### 2.1 Pré-requisitos
* Node.js (v24.14.0)
* Aplicativo **Expo Go** no celular (Android/iOS) — ou emulador Android / simulador iOS configurado
* Git instalado
* Back-end Flask da ResolveAí rodando (localmente ou em um ambiente acessível pelo dispositivo/emulador)

### 2.2 Configuração do App

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto (ou copie o `.env.example`, quando existir):
   ```bash
   cp .env.example .env
   ```
   Preencha as variáveis conforme detalhado na seção [Variáveis de Ambiente](#3-variáveis-de-ambiente).

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run start
   ```
4. Abra o app:
   * Escaneie o QR code exibido no terminal com o app **Expo Go** (Android/iOS)
   * Pressione `a` para abrir no emulador Android
   * Pressione `i` para abrir no simulador iOS (necessário macOS)
   * Pressione `w` para abrir a versão web do Expo no navegador

5. Rode os testes e a checagem de tipos:
   ```bash
   npm test
   npx tsc --noEmit
   ```

### 2.3 Build empacotado (EAS)

O projeto está vinculado ao EAS (`extra.eas.projectId` no `app.json`) e tem dois perfis em `eas.json`:

| Perfil | Saída | Uso |
| :--- | :--- | :--- |
| `preview` | APK (Android) / build interno (iOS) | Instalar direto no celular para testes e apresentação |
| `production` | AAB / IPA para as lojas | Publicação |

```bash
npx eas-cli login       # só na primeira vez (não precisa instalar nada globalmente)
npm run build:apk        # = npx eas-cli build --platform android --profile preview
npm run build:ios        # IPA (exige conta Apple Developer)
```

Ao terminar, o EAS mostra o link/QR code para baixar o APK. A URL da API embutida nos perfis `preview`/`production` é a do back-end publicado (`EXPO_PUBLIC_API_URL` em `eas.json`); altere-a lá se o servidor mudar.

### 2.4 Notificações (registrar → acompanhar → notificar)

1. Ao entrar no app, o usuário autoriza as notificações e o app envia o Expo push token para `PUT /auth/push-token`.
2. Quando um **gestor** muda o status de uma demanda, o back-end envia a notificação ao autor ("Sua demanda foi atualizada").
3. Tocar na notificação abre o detalhe da demanda; com o app aberto, a demanda é atualizada na hora.

> O push remoto não funciona no **Expo Go para Android** (limitação do SDK 53+). Nesse caso o app usa notificações **locais**: ao recarregar a lista ou o detalhe e perceber que o status mudou, ele avisa o cidadão. Para testar o push remoto, use o APK do perfil `preview`.

## 3 Variáveis de Ambiente

O Expo expõe ao código do app apenas variáveis com o prefixo `EXPO_PUBLIC_`. As seguintes variáveis devem ser configuradas no arquivo `.env` na raiz do projeto:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | URL base da API Flask (mesma API consumida pela aplicação web) | `http://localhost:5000` |

> No celular físico (Expo Go), `localhost` aponta para o próprio celular: use o IP da sua máquina na rede (ex.: `http://192.168.3.9:5000`).

## 4 Estrutura do Projeto

Organização de pastas:

* `/src/api`: Cliente HTTP (Axios com refresh de token), envelope de resposta e chamadas de autenticação, demandas, métricas e push token
* `/src/notifications`: Permissão, registro do push token, notificação local e navegação ao tocar
* `/src/auth`: Estado global de sessão (Context) e armazenamento seguro de tokens (SecureStore)
* `/src/stores`: Estado global das demandas (Zustand)
* `/src/components`: Componentes reutilizáveis de UI (Button, TextField, SelectField, PhotoField, DemandCard, StatusBadge, TabBar, ConfirmModal, Toast...)
* `/src/domain`: Regras e formatação de domínio (rótulos de categoria/status, datas, protocolo, permissão de exclusão)
* `/src/hooks`: Hooks reutilizáveis (ex.: endereço atual via GPS)
* `/app`: Rotas do Expo Router (cada arquivo é uma tela/URL; os `_layout.tsx` definem pilhas, abas e a proteção por login)
* `/src/navigation`: Helpers de rota (caminhos e leitura dos parâmetros de URL)
* `/src/screens`: Telas do aplicativo
* `/src/theme`: Cores e tipografia

Documentação complementar: [fluxo de autenticação](docs/auth-flow.md) e [telas de demandas](docs/demandas.md).

---

## 5 Localização da Documentação

Documentação dos endpoints da API (compartilhada com a aplicação web):

* **Swagger / OpenAPI (interativo):** https://smart-city-z13w.onrender.com/docs/ — localmente em `http://localhost:5000/docs/`. A especificação é o arquivo `backend/swagger.yaml` do [repositório do back-end](https://github.com/ndrfelipe/smart-city).
* **Postman:** https://documenter.getpostman.com/view/47073825/2sBXwvHTeT

Back-end, banco de dados e variáveis de ambiente do servidor (`DATABASE_URL`, `SECRET_KEY`, criação da conta de gestor): ver o README do [repositório do back-end](https://github.com/ndrfelipe/smart-city). Em resumo, o servidor cria as tabelas sozinho ao iniciar; em produção usa PostgreSQL (Render) e, localmente, qualquer banco aceito pelo SQLAlchemy.

### 5.1 Vídeo demonstrativo

Screencast do sistema completo integrado (cadastro/login → registro de demanda com foto e GPS → acompanhamento e filtros → atualização de status pelo gestor → notificação ao cidadão): **[link do vídeo](COLOQUE_AQUI_O_LINK_DO_VIDEO)**

---

## 6 Principais Endpoints Consumidos

### 6.1 Autenticação (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cria uma nova conta de usuário |
| `POST` | `/auth/login` | Autentica e retorna `access_token` + `refresh_token` |
| `GET` | `/auth/me` | Retorna os dados do usuário logado |
| `PATCH` | `/auth/update` | Atualiza nome e/ou senha (o perfil de acesso não muda por aqui) |
| `PUT` / `DELETE` | `/auth/push-token` | Ativa/desativa as notificações push no aparelho |
| `POST` | `/auth/refresh` | Renova o `access_token` usando o `refresh_token` |
| `GET` | `/auth/logout` | Invalida o token e encerra a sessão |

### 6.2 Gerenciamento de Demandas (`/api/demandas`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/demandas` | Lista as demandas com paginação, busca (`q`) e filtros (`status`, `categoria`, `regiao`, `prioridade`) |
| `GET` | `/api/demandas/metricas` | Indicadores do painel do gestor (somente gestor) |
| `POST` | `/api/demandas` | Cidadão cria uma nova solicitação urbana |
| `GET` | `/api/demandas/{id}` | Retorna os detalhes de uma demanda específica |
| `PATCH` | `/api/demandas/{id}` | Atualiza a demanda; o gestor muda o status (o autor é notificado) |
| `DELETE` | `/api/demandas/{id}` | Remove uma demanda (respeitando regras de role) |
| `PUT` | `/api/demandas/{id}/foto` | Envia/substitui a foto da demanda (`multipart/form-data`, campo `foto`) |
| `GET` | `/api/demandas/fotos/{arquivo}` | Imagem da demanda (use o `photoUrl` retornado) |

---

## 7 Métodos HTTP Utilizados

A API segue os princípios REST, utilizando os métodos HTTP de acordo com a semântica de cada operação:

| Método | Uso | Exemplo na API |
|--------|-----|----------------|
| `GET` | Leitura de dados | Listar demandas, obter perfil, logout |
| `POST` | Criação de recursos | Registrar usuário, fazer login, criar demanda |
| `PATCH` | Atualização parcial | Atualizar perfil/role, atualizar status de demanda |
| `DELETE` | Remoção de recursos | Deletar demanda urbana |

---

## 8 Regras de Autorização por Role

O comportamento do app deve respeitar as mesmas regras aplicadas pela API:

- **CITIZEN (Cidadão):** cria demandas, edita e exclui apenas as próprias (enquanto pendentes), visualiza o próprio histórico.
- **MANAGER (Gestor):** atualiza status e prioridade de qualquer demanda, não pode excluir demandas já concluídas.
- **Contas de gestor** são criadas/promovidas no servidor (`flask ... create-gestor`, ver README do back-end); o cadastro do app sempre cria cidadãos.
- No app, o **Início** mostra o *Painel do Gestor* para gestores e a Home para cidadãos; a alteração de status aparece só para gestores no detalhe da demanda.

---
