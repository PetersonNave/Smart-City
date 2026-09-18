# ResolveAí - App Mobile de Gestão de Demandas Urbanas

Bem-vindos ao repositório do app mobile da Plataforma de Gestão de Demandas Urbanas! Este projeto é o cliente **mobile** (Expo / React Native) do mesmo produto ResolveAí cuja versão web centraliza o registro, acompanhamento e gestão de solicitações públicas (como buracos em vias, iluminação e saneamento), conectando cidadãos e gestores públicos.

Este repositório contém apenas o front-end mobile. Ele consome a **mesma API** (Flask) utilizada pela aplicação web — o back-end é compartilhado entre os dois clientes e deve ser executado a partir do seu próprio repositório.

## 1 Tecnologias Utilizadas

* **Framework:** Expo (React Native) com TypeScript
* **Navegação:** a definir (ex.: Expo Router / React Navigation)
* **Estilização:** a definir
* **Gerenciamento de Estado:** a definir
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

## 3 Variáveis de Ambiente

O Expo expõe ao código do app apenas variáveis com o prefixo `EXPO_PUBLIC_`. As seguintes variáveis devem ser configuradas no arquivo `.env` na raiz do projeto:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | URL base da API Flask (mesma API consumida pela aplicação web) | `http://localhost:5000` |

## 4 Estrutura do Projeto

Organização de pastas planejada, seguindo a mesma lógica de responsabilidades adotada na aplicação web:

* `/src/screens`: Telas do aplicativo
* `/src/components`: Componentes reutilizáveis (UI, formulários, layout)
* `/src/services`: Configuração e chamadas para a API
* `/src/store`: Gerenciamento de estado global
* `/src/types`: Definições de interfaces e tipos do TypeScript

> No momento o projeto está em estado de **scaffold** (ponto de entrada em `App.tsx`/`index.ts` na raiz, gerado pelo `create-expo-app`); essa estrutura de pastas será criada conforme o desenvolvimento avança.

---

## 5 Localização da Documentação

A documentação completa da API (compartilhada com a aplicação web) pode ser encontrada no link: https://documenter.getpostman.com/view/47073825/2sBXwvHTeT

---

## 6 Principais Endpoints Consumidos

### 6.1 Autenticação (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cria uma nova conta de usuário |
| `POST` | `/auth/login` | Autentica e retorna `access_token` + `refresh_token` |
| `GET` | `/auth/me` | Retorna os dados do usuário logado |
| `PATCH` | `/auth/update` | Atualiza perfil ou promove cargo (Admin/Gestor) |
| `POST` | `/auth/refresh` | Renova o `access_token` usando o `refresh_token` |
| `GET` | `/auth/logout` | Invalida o token e encerra a sessão |

### 6.2 Gerenciamento de Demandas (`/api/demandas`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/demandas` | Lista todas as demandas (com filtros e paginação) |
| `POST` | `/api/demandas` | Cidadão cria uma nova solicitação urbana |
| `GET` | `/api/demandas/{id}` | Retorna os detalhes de uma demanda específica |
| `PATCH` | `/api/demandas/{id}` | Atualiza status ou prioridade da demanda |
| `DELETE` | `/api/demandas/{id}` | Remove uma demanda (respeitando regras de role) |

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
- **ADMIN:** pode promover usuários para Gestor via `PATCH /auth/update`.

---
