# Fluxo de autenticação

## Boot do app

1. `AuthProvider` monta com `status = 'bootstrapping'` (tela de Loading visível).
2. Lê tokens do `expo-secure-store` (`src/auth/storage.ts`).
3. Sem token → `status = 'guest'` (vai para Login/Cadastro).
4. Com token → chama `GET /auth/me`. Sucesso → `status = 'authenticated'`. Falha → limpa
   tokens e cai para `guest`.

## Login / Cadastro

- `LoginScreen` e `CadastroScreen` chamam `useAuth().login()` / `useAuth().register()`.
- Cadastro bem-sucedido loga automaticamente (chama `login()` internamente) — não existe
  uma segunda tela de "cadastro concluído, agora faça login".
- Erros 400 de validação da API (ex.: e-mail duplicado) chegam como `ApiValidationError`
  e são mapeados para o campo correspondente do formulário; outros erros aparecem como
  mensagem genérica abaixo dos campos. Sem conexão com o servidor, a mensagem é
  "Não foi possível conectar ao servidor..." (`src/api/envelope.ts`).

## Renovação automática de token (refresh)

- Toda chamada autenticada passa pelo `apiClient` (`src/api/client.ts`), que injeta
  `Authorization: Bearer <access_token>` via interceptor de request.
- Em qualquer resposta 401, o interceptor de response chama `POST /auth/refresh` **uma
  única vez** (flag `_retry` evita loop), usando o refresh token salvo. Se funcionar,
  salva os novos tokens (o backend rotaciona o refresh token a cada uso) e repete a
  requisição original.
- Se o refresh falhar (token expirado/inválido/já usado), os tokens são apagados do
  SecureStore e `AuthContext` é notificado via `setOnRefreshFailure` — o app volta pro
  fluxo de Login em qualquer tela, não só no boot.

## Logout

- `useAuth().logout()` chama `GET /auth/logout` (ignora falha de rede — o logout local
  acontece de todo modo), limpa o SecureStore e volta `status` para `guest`.
