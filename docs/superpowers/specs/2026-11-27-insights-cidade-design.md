# Insights da cidade (dados da pipeline no app do gestor) — design

## Por quê

Desafio da disciplina de dados (entrega 05/12): criar um produto baseado nos dados da
pipeline do grupo ([etl-smart-city](https://github.com/victorrmatiass/etl-smart-city)),
lendo do banco montado na disciplina (Neon), nunca direto da API pública. A ideia do grupo é
levar uma tela do dashboard Streamlit para o perfil de gestor do ResolveAí, como
"insights para gestores", mostrando na apresentação o caminho do dado:
API CKAN → MongoDB (bronze) → transformação → Neon (prata) → backend → app.

## Objetivos

- Tela nativa "Insights da cidade", acessível só ao gestor, replicando a aba **Panorama**
  do dashboard: 4 indicadores, distribuição por situação, top 5 grupos de serviço,
  volume por RPA e top 8 bairros, com filtro por RPA.
- Dados lidos do Neon (`emlurb_156_demandas`, `emlurb_156_auditoria`) pelo backend Flask.
- Rodapé com a procedência: período, origem da carga, data de extração, reconciliação bronze = prata.

## Não objetivos

- Filtros de bairro, grupo, situação e data; mapa; tabela e download CSV (continuam no Streamlit).
- Escrever no Neon ou rodar a ETL a partir do app.

## Anti-objetivos

- Credencial do Neon no app ou no código versionado.
- Dados fixos/demonstrativos quando o Neon falhar.

## Abordagens consideradas

1. **Endpoint no backend + tela nativa (escolhida).** Cumpre "ler do banco", não expõe credencial,
   mantém o visual do app e deixa o caminho do dado explicável.
2. App conectando direto ao Neon — descartada: credencial dentro do APK.
3. WebView do Streamlit hospedado — descartada: depende de hospedar o Streamlit e destoa do app.
4. JSON fixo no app — descartada: não lê do banco.

## Design

**Backend** (`ndrfelipe/smart-city`, Flask):
- `GET /api/insights/recife?rpa=1..6` com `required_token` + `required_role('gestor')`, envelope padrão.
- `services/insights_service.py`: `psycopg2` com `NEON_DATABASE_URL`, sessão somente leitura,
  `connect_timeout` e `statement_timeout` de 10 s, cache em memória de 10 min por filtro.
- Sem `NEON_DATABASE_URL` ou com falha de conexão: 503 com mensagem clara. `rpa` inválida: 400.
- Testes com a camada de consulta mockada; rota documentada no `swagger.yaml`.

**App** (Expo):
- `src/api/insights.ts` com o tipo da resposta.
- Card "Insights da cidade" no `PainelGestorScreen` → rota `app/(app)/insights.tsx`
  (`src/screens/gestor/InsightsCidadeScreen.tsx`).
- Chips de RPA, indicadores, rosca em `react-native-svg`, barras horizontais com `View`,
  estados de carregando/erro/pull-to-refresh, rodapé de procedência.
- Testes Jest da API e da tela.

## Restrições

- Commits como PetersonNave, sem coautoria; `git pull` antes de mexer no backend (repo compartilhado).
- `NEON_DATABASE_URL` cadastrada no Render por quem gerencia as envs (no fim do trabalho).
- Recomendado: trocar depois por um usuário Neon somente leitura.

## A critério do implementador

Layout fino dos cards, cores por situação (seguir as do dashboard), textos de apoio.
