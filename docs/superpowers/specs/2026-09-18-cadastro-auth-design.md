# Cadastro + Auth + App Shell — Design

Data: 2026-09-18

## Objetivo

Segunda entrega do app ResolveAí: tela de cadastro (não existe no Figma —
baseada na tela de Login), fluxo de autenticação completo (login/cadastro
com refresh token), tela de loading, e a casca de navegação por abas que
aparece depois do login. Componentes de UI usados nas telas devem ser
reutilizáveis e ter estados visuais validados (foco, erro, preenchido,
desabilitado).

## Decisões de stack (confirmadas com o usuário)

| Decisão | Escolha | Motivo |
|---|---|---|
| Navegação | React Navigation (native-stack + bottom-tabs) | Padrão de mercado em RN puro, se encaixa com `/src/screens` já planejado no README |
| Estado global de auth | Context API + hooks | Sem dependência nova, suficiente pro escopo atual |
| Cliente HTTP | Axios | Interceptors simplificam o retry automático de token expirado |
| Validação de formulário | react-hook-form + zod | Validação declarativa, schemas reaproveitáveis nos próximos formulários |
| Animações | react-native-reanimated | Padrão do ecossistema Expo/RN, roda na UI thread |
| Persistência de tokens | expo-secure-store | Mais seguro que AsyncStorage para access/refresh token |
| Ícones que faltam na pasta `assets/icons` | `lucide-react-native` + `react-native-svg` | Os SVGs já extraídos (`Home.svg`, `Clipboard.svg`) são paths do Lucide escalados 2x com cor fixa — usar a lib dá os mesmos ícones com cor dinâmica (ex.: aba ativa/inativa) |
| Testes | Jest (`jest-expo`) + `@testing-library/react-native` | Padrão para projetos Expo/RN |

## Contrato da API (backend Flask em `http://localhost:5000`, confirmado lendo o código em `Smartcity legado/smart-city/backend`)

Envelope padrão de resposta: `{ data, message, status_code }`.

- `POST /auth/register` — body `{ username, email, password }` (role é
  sempre forçado para `cidadao` no servidor, não enviar). Sucesso 201:
  `data = { id, name, email, role, createdAt }`. Erro 400:
  `data = { errors: { campo: [mensagens] } }` (ex.: email duplicado).
- `POST /auth/login` — body `{ email, password }`. Sucesso 200:
  `data = { access_token, refresh_token, user: {...} }`. Erro 400/401.
- `POST /auth/refresh` — body `{ refresh_token }`. Sucesso 200:
  `data = { access_token, refresh_token }` (refresh token é rotativo —
  o antigo é invalidado no backend). Erro 401 se expirado/inválido/já usado.
- `GET /auth/me` — header `Authorization: Bearer <access_token>`. Retorna
  o usuário logado; usado no boot do app para restaurar sessão.
- `GET /auth/logout` — invalida o token atual no backend.

Observação: o schema de resposta do usuário usa a chave `name` (não
`username`) — `UserResponseSchema.name = fields.Str(attribute='username')`.

## Arquitetura de pastas

```
src/
  api/
    client.ts       # instância axios (baseURL = EXPO_PUBLIC_API_URL), interceptors de auth
    auth.ts          # register(), login(), refreshToken(), getMe(), logout() + tipos
  auth/
    AuthContext.tsx  # Provider: status, user, tokens, login, register, logout
    useAuth.ts        # hook de consumo
    storage.ts         # wrapper do expo-secure-store (getTokens/setTokens/clearTokens)
  components/
    Button/
    TextField/
    Loading/
    GradientBackground/
    Icon/
    (cada um com index.tsx + <Nome>.test.tsx)
  navigation/
    RootNavigator.tsx  # escolhe LoadingScreen | AuthStack | AppTabs por status
    AuthStack.tsx        # Login <-> Cadastro
    AppTabs.tsx           # Início, Mapa, Demandas, Perfil
  screens/
    LoadingScreen.tsx
    auth/LoginScreen.tsx
    auth/CadastroScreen.tsx
    home/HomeScreen.tsx
    home/MapaScreen.tsx        # placeholder "em construção"
    home/DemandasScreen.tsx    # placeholder
    home/PerfilScreen.tsx      # placeholder
  theme/  # já existe (colors, typography)
```

## Fluxo de autenticação

1. **Boot**: `AuthContext` monta com `status = 'bootstrapping'`. Lê tokens
   do SecureStore. Se existirem, chama `GET /auth/me` (passando pelo
   interceptor de refresh se o access token já tiver expirado). Sucesso →
   `status = 'authenticated'`, `user` populado. Falha (sem token, ou
   refresh também inválido) → `status = 'guest'`.
2. **RootNavigator** renderiza `LoadingScreen` enquanto `bootstrapping`,
   `AuthStack` quando `guest`, `AppTabs` quando `authenticated`.
3. **Login/Cadastro**: telas chamam `login()`/`register()` do
   `AuthContext`. Em caso de sucesso, tokens vão para o SecureStore e o
   `status` muda para `authenticated` (o `RootNavigator` troca de tela
   automaticamente). Erros da API (400/401) são mapeados para mensagem
   amigável e exibidos no formulário (erro de campo quando a API aponta
   um campo específico, ex. e-mail duplicado; banner genérico nos demais
   casos).
4. **Renovação automática**: o interceptor de resposta do Axios detecta
   401, tenta `POST /auth/refresh` uma única vez com o refresh token
   salvo, atualiza o SecureStore e repete a requisição original. Se o
   refresh falhar, dispara `logout()` (limpa tokens, `status = 'guest'`).
5. **Logout**: chama `GET /auth/logout`, limpa o SecureStore e volta
   `status` para `guest`.

## Componentes

- **`<TextField>`**: label, ícone opcional (via `<Icon>`), estados
  visuais — default, focado (borda animada com Reanimated), erro (borda
  vermelha + mensagem abaixo + leve "shake"), preenchido corretamente,
  desabilitado; prop `secureTextEntry` com botão de mostrar/ocultar senha
  (ícones `eye`/`eye-off`).
- **`<Button>`**: variantes `primary`/`secondary`, estados
  default/pressed (escala via Reanimated)/disabled/loading (spinner).
- **`<GradientBackground>`**: reaproveita o gradiente do Login
  (`#56C596 → #329D9C → #205072`) no Loading e no Cadastro.
- **`<Icon>`**: wrapper único sobre `lucide-react-native` (nome do ícone,
  `size`, `color`) — ponto único de import de ícones no app.
- **`<Loading>`**: indicador de carregamento reaproveitável (usado na
  LoadingScreen de boot e no estado `loading` do `<Button>`).

## Responsividade

O Figma exporta posições absolutas para um iPhone 16 Plus. A
implementação usa Flexbox (`flex`, `%`, `maxWidth`) em vez de valores
fixos em pixel, e `useSafeAreaInsets` (via
`react-native-safe-area-context`, dependência do React Navigation) para
respeitar notch/status bar em qualquer tamanho de tela.

## Animações (Reanimated)

- Transição de foco/erro nos `<TextField>` (cor de borda, shake no erro).
- Escala no `<Button>` ao pressionar.
- Fade/scale de entrada nas telas de auth e na LoadingScreen.

## Testes

- Unitários por componente: estados renderizados corretamente (erro,
  foco, desabilitado, loading).
- Por tela: validação de formulário (mensagens de erro do zod),
  submissão com sucesso e com erro (mock do módulo `api/auth.ts`),
  navegação entre Login ↔ Cadastro e para dentro do AppTabs após sucesso.
- `AuthContext`: bootstrap com/sem token salvo, fluxo de refresh em 401,
  logout limpando o SecureStore.

## Documentação

- Preencher as seções "a definir" do README (Navegação, Estilização,
  Gerenciamento de Estado).
- `docs/auth-flow.md`: diagrama/texto curto do fluxo de autenticação e
  renovação de token, para consulta futura.
- Comentários no código só onde a decisão não é óbvia pelo nome/tipo.

## Fora do escopo desta entrega

- Conteúdo real das abas Mapa, Demandas e Perfil (ficam como
  placeholder "em construção").
- Recuperação de senha, verificação de e-mail.
- Upload de foto de perfil/avatar.
