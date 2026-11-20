# Modo offline e atualizações OTA (acompanhamento 20/11)

## Atualizações OTA (`expo-updates`)

- `app.json`: `updates.url` aponta para o projeto EAS e `runtimeVersion` usa a política `appVersion`
  (um update só chega a builds com a mesma versão do app).
- `eas.json`: cada perfil de build tem um canal (`preview`, `production`).
- `src/updates/useOtaUpdates.ts`: ao abrir o app, verifica e baixa o update em segundo plano e
  pergunta se o usuário quer reiniciar. Desligado em desenvolvimento.
- Publicar: `npm run update:preview` (ou `update:production`). Requer um build feito depois desta mudança.

## Modo offline / cache local (`AsyncStorage`)

- `src/storage/cache.ts`: leitura/escrita de JSON com data de gravação, sob o prefixo `resolveai.cache.`.
- Sessão: o usuário de `/auth/me` é salvo; sem conexão, o app restaura a sessão com ele em vez de
  deslogar (tokens continuam no SecureStore). Erro 401 ou de API continua deslogando.
- Demandas: a primeira página sem filtros e cada demanda consultada ficam salvas. Sem conexão, a
  lista e o detalhe mostram os dados salvos (filtros aplicados localmente) com o aviso `OfflineBanner`.
- Logout e troca de conta limpam o cache.
