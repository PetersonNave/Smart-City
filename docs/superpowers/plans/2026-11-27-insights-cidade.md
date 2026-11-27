# Insights da cidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O gestor vê no app uma tela "Insights da cidade" com os dados da Central 156 lidos do Neon (prata da pipeline etl-smart-city) através do backend Flask.

**Architecture:** O backend ganha `GET /api/insights/recife` (token + perfil gestor), que consulta o Neon em sessão somente leitura via `psycopg2`, agrega em SQL e guarda 10 min em memória. O app consome a rota numa tela nova em stack, aberta por um card no Painel do Gestor.

**Tech Stack:** Flask 3 + psycopg2 + unittest (backend, `C:\Users\peter\OneDrive\Documentos\Smartcity legado\smart-city\backend`); Expo SDK 58 + expo-router + NativeWind + react-native-svg + Jest/RNTL (app, este repo).

**Spec:** `docs/superpowers/specs/2026-11-27-insights-cidade-design.md`

## Global Constraints

- Commits com a conta PetersonNave e **sem** trailer `Co-Authored-By`.
- `NEON_DATABASE_URL` só em `.env` (ignorado pelo git) e no Render; nunca no código, testes ou docs.
- Conexão Neon: `set_session(readonly=True)`, `connect_timeout=10`, `options='-c statement_timeout=10000'`.
- Cache em memória de 600 s por valor de `rpa`.
- Backend: `git pull` antes de começar (repo compartilhado com ndrfelipe); push direto na `main`.
- Textos de UI em português; dados não são inventados quando o Neon falha (503 → tela de erro).
- Nomes das RPAs: 1 Centro, 2 Norte, 3 Noroeste, 4 Oeste, 5 Sudoeste, 6 Sul.
- Cores por situação (do dashboard): Atendida `#13957f`, Execucao `#3b79ba`, Cadastrada `#93bfc7`, Preparacao `#e8ad55`, Pendencia `#c77a50`, Fiscalizacao `#777998`, Não informado `#c0c7cb`.

## Review Focus

- `rpa` fora de 1..6 ou não numérica (`?rpa=abc`, `?rpa=0`) → 400 com mensagem, não 500. (teste na Task 2)
- `NEON_DATABASE_URL` ausente no Render → 503 "Dados da pipeline indisponíveis", não 500 nem crash no boot. (teste na Task 2)
- Neon inacessível/timeout → 503 e o cache não guarda a falha. (teste na Task 1)
- Cidadão chamando a rota → 403. (teste na Task 2)
- Recorte RPA sem nenhuma demanda (total 0) → taxa `null` e tela mostra estado vazio, sem divisão por zero. (testes nas Tasks 1 e 4)

## File Structure

Backend:
- Create `services/insights_service.py` — conexão Neon, SQL, montagem da resposta, cache.
- Create `controllers/insights_controller.py` — valida `rpa`, mapeia exceções em 400/503.
- Create `routes/insights_routes.py` — blueprint `/api/insights`.
- Modify `config/config.py` — registrar o blueprint.
- Modify `swagger.yaml` — rota + schema `InsightsRecifeResponse`.
- Create `test_insights.py`.
- Modify `.env` local (não versionado) — `NEON_DATABASE_URL`.

App:
- Create `src/api/insights.ts` (+ `insights.test.ts`).
- Create `src/components/BarList/index.tsx` — extrair `Distribuicao` do painel para reuso.
- Create `src/components/DonutChart/index.tsx` — rosca em react-native-svg.
- Create `src/screens/gestor/InsightsCidadeScreen.tsx` (+ `.test.tsx`).
- Create `app/(app)/insights.tsx`; modify `app/(app)/_layout.tsx`, `src/navigation/routes.ts`.
- Modify `src/screens/gestor/PainelGestorScreen.tsx` (+ test) — card de entrada e uso do `BarList`.
- Modify `README.md` / `docs/` — seção curta da feature.

---

### Task 1: Serviço de insights no backend

**Files:**
- Create: `services/insights_service.py`
- Test: `test_insights.py`

**Interfaces:**
- Produces:
  - `class InsightsIndisponiveis(Exception)`
  - `InsightsService.recife(rpa: int | None = None) -> dict` — levanta `InsightsIndisponiveis` sem URL ou em falha de conexão/consulta.
  - `InsightsService._consultar(rpa: int | None) -> dict` — ponto único de I/O (mockado nos testes), devolve os brutos: `{'situacoes': [(situacao, n)], 'grupos': [(grupo, n)], 'rpas': [(rpa, n)], 'bairros': [(bairro, n)], 'resumo': (total, atendidas, em_andamento, bairros, min_ult, max_ult), 'auditoria': (total_bronze, total_final, sem_coordenadas, origem_extracao, carga_id, data_extracao) | None}`
  - `InsightsService.limpar_cache() -> None`
  - Formato de `recife()`:
    ```json
    {
      "filtro": {"rpa": 6, "rpa_nome": "Sul"},
      "indicadores": {"total": 2796, "atendidas": 1900, "taxa_atendimento": 0.679, "em_andamento": 896, "bairros": 18},
      "por_situacao": [{"situacao": "Atendida", "total": 1900}],
      "top_servicos": [{"grupo": "Iluminacao Publica", "total": 900}],
      "por_rpa": [{"rpa": 1, "nome": "Centro", "total": 1177}],
      "top_bairros": [{"bairro": "Boa Viagem", "total": 700}],
      "fonte": {"nome": "Central 156 · EMLURB", "periodo_inicio": "2026-01-01", "periodo_fim": "2026-01-30",
                "origem_extracao": "API CKAN", "carga_id": "493f…", "data_extracao": "2026-10-23T22:15:51+00:00",
                "total_bronze": 11374, "total_final": 11374, "sem_coordenadas": 5291}
    }
    ```

- [ ] **Step 1: Escrever os testes que falham** (`InsightsServiceTestCase`, com `mock.patch.object(InsightsService, '_consultar', return_value=BRUTOS)` e `limpar_cache()` no `setUp`):
  - `test_monta_indicadores_e_listas`: `taxa_atendimento == round(7662/11374, 3)`; `top_servicos` tem no máximo 5, `top_bairros` no máximo 8, ambos em ordem decrescente; `por_rpa[0] == {'rpa': 1, 'nome': 'Centro', 'total': 1177}`; nulos viram `'Não informado'` (situação/grupo/bairro) e RPA nula vira `{'rpa': None, 'nome': 'Não informada', ...}`; `filtro == {'rpa': None, 'rpa_nome': None}`; datas em ISO.
  - `test_total_zero_tem_taxa_nula`: resumo `(0, 0, 0, 0, None, None)` → `taxa_atendimento is None`, períodos `None`.
  - `test_cache_por_rpa`: duas chamadas `recife(6)` → `_consultar` chamado 1 vez; `recife(None)` depois → 2 vezes.
  - `test_falha_nao_e_cacheada`: `_consultar` com `side_effect=[InsightsIndisponiveis('x'), BRUTOS]` → 1ª chamada levanta, 2ª devolve dados.
  - `test_sem_url_indisponivel`: com `NEON_DATABASE_URL` removida do ambiente e sem mock → levanta `InsightsIndisponiveis`.

- [ ] **Step 2: Rodar e ver falhar** — `venv/Scripts/python.exe -m unittest test_insights -v` → `ModuleNotFoundError: services.insights_service`.

- [ ] **Step 3: Implementar `services/insights_service.py`.** `_consultar` abre `psycopg2.connect(url, connect_timeout=10, options='-c statement_timeout=10000')`, `set_session(readonly=True)`, faz 6 SELECTs agregados em `emlurb_156_demandas` (com `WHERE rpa = %s` quando houver filtro; `por_rpa` ignora o filtro para sempre mostrar as 6 RPAs) e 1 em `emlurb_156_auditoria` (`ORDER BY data_extracao DESC LIMIT 1`), e fecha a conexão em `finally`. `em_andamento` = `situacao_categoria = 'Em andamento'`, `atendidas` = `concluida IS TRUE`. Qualquer `psycopg2.Error` vira `InsightsIndisponiveis`. Cache: dict `{rpa: (timestamp, resposta)}` com TTL de 600 s.

- [ ] **Step 4: Rodar e ver passar** — mesmo comando → OK.

- [ ] **Step 5: Smoke real contra o Neon** — com `NEON_DATABASE_URL` no `.env`: `venv/Scripts/python.exe -c "from dotenv import load_dotenv; load_dotenv(); from services.insights_service import InsightsService as S; r=S.recife(); print(r['indicadores'], r['fonte']['total_final'])"` → `total 11374`, `taxa_atendimento 0.674`, `total_final 11374`.

- [ ] **Step 6: Commit** — `git add services/insights_service.py test_insights.py && git commit -m "feat: servico de insights da Central 156 lido do Neon (somente leitura, cache de 10 min)"`

### Task 2: Rota `/api/insights/recife` + Swagger

**Files:**
- Create: `controllers/insights_controller.py`, `routes/insights_routes.py`
- Modify: `config/config.py` (registrar `insights_bp`), `swagger.yaml`
- Test: `test_insights.py`

**Interfaces:**
- Consumes: `InsightsService.recife`, `InsightsIndisponiveis` (Task 1).
- Produces: `GET /api/insights/recife?rpa=<1..6>` → 200 `standard_response(data=<formato da Task 1>)`.

- [ ] **Step 1: Escrever os testes que falham** (`InsightsRotaTestCase`, setup igual a `test_acompanhamento_notificacoes_metricas.py`: sqlite em memória, usuário `gestora` com `role='gestor'` e `ana` cidadã, login por `/auth/login`; `InsightsService.recife` mockado):
  - `test_gestor_recebe_insights`: 200; `data['indicadores']['total'] == 11374`; `recife` chamado com `None`.
  - `test_filtro_rpa`: `?rpa=6` → `recife` chamado com `6`.
  - `test_rpa_invalida`: `?rpa=abc`, `?rpa=0` e `?rpa=7` → 400, mensagem `'Parâmetro rpa deve ser um número de 1 a 6.'`.
  - `test_cidadao_proibido`: token de `ana` → 403.
  - `test_sem_token`: → 401.
  - `test_neon_indisponivel`: `recife` com `side_effect=InsightsIndisponiveis(...)` → 503, mensagem `'Dados da pipeline indisponíveis no momento. Tente novamente em instantes.'`.

- [ ] **Step 2: Rodar e ver falhar** — `venv/Scripts/python.exe -m unittest test_insights -v` → 404 nas rotas.

- [ ] **Step 3: Implementar** `InsightsController.recife()` (lê `request.args.get('rpa')`, valida com `str.isdigit()` e faixa 1..6) e `insights_bp = Blueprint('insights', __name__, url_prefix='/api/insights')` com `'/recife'` → `required_token(required_role('gestor')(InsightsController.recife))`; registrar em `create_app`. Swagger: path `/api/insights/recife` (tag "Painel do gestor", parâmetro `rpa`, respostas 200/400/401/403/503) e schema `InsightsRecifeResponse` espelhando o formato da Task 1.

- [ ] **Step 4: Rodar a suíte inteira** — `venv/Scripts/python.exe -m unittest discover -p "test_*.py" -v` → tudo OK, inclusive os testes antigos.

- [ ] **Step 5: Smoke HTTP local** — subir `venv/Scripts/python.exe app.py`, logar com um gestor local e `curl -H "Authorization: Bearer …" localhost:5000/api/insights/recife?rpa=6` → 200 com `filtro.rpa_nome == "Sul"` e `indicadores.total == 2796`.

- [ ] **Step 6: Commit e push** — `git add controllers/insights_controller.py routes/insights_routes.py config/config.py swagger.yaml test_insights.py && git commit -m "feat: rota GET /api/insights/recife para o gestor, com dados da pipeline no Neon" && git pull --rebase && git push`

### Task 3: Cliente da API e componentes de gráfico no app

**Files:**
- Create: `src/api/insights.ts`, `src/api/insights.test.ts`
- Create: `src/components/BarList/index.tsx`, `src/components/BarList/BarList.test.tsx`
- Create: `src/components/DonutChart/index.tsx`, `src/components/DonutChart/DonutChart.test.tsx`
- Modify: `src/screens/gestor/PainelGestorScreen.tsx` (trocar `Distribuicao` local por `BarList`)

**Interfaces:**
- Consumes: formato da Task 1.
- Produces:
  - `type InsightsRecife` (espelho exato do JSON da Task 1; `rpa`/`rpa_nome`/`taxa_atendimento`/datas como `| null`)
  - `obterInsightsRecife(rpa?: number): Promise<InsightsRecife>` → `apiClient.get('/api/insights/recife', { params: rpa ? { rpa } : undefined })` desembrulhado com `unwrap`.
  - `type BarItem = { key: string; label: string; value: number; color: string }`
  - `BarList({ title, items, testID, formatValue? }: { title: string; items: BarItem[]; testID?: string; formatValue?: (n: number) => string })` — mesmo visual e `accessibilityLabel` `"<label>: <valor formatado>"` do `Distribuicao` atual.
  - `DonutChart({ slices, centerValue, centerLabel, size = 180, testID }: { slices: { key: string; value: number; color: string }[]; centerValue: string; centerLabel: string; size?: number; testID?: string })` — `Svg` + um `Circle` por fatia com `strokeDasharray`/`strokeDashoffset`; total 0 desenha só o anel de fundo.

- [ ] **Step 1: Testes que falham**
  - `insights.test.ts`: `obterInsightsRecife()` chama `GET /api/insights/recife` sem params; `obterInsightsRecife(3)` com `{ params: { rpa: 3 } }`; devolve `data` do envelope (seguir o padrão de mock de `demandas.test.ts`).
  - `BarList.test.tsx`: renderiza título e `getByLabelText('Iluminação: 4.118')` com `formatValue` pt-BR.
  - `DonutChart.test.tsx`: mostra `centerValue` e `centerLabel`; com fatias somando 0 não quebra.
- [ ] **Step 2: Rodar e ver falhar** — `npx jest src/api/insights src/components/BarList src/components/DonutChart` → módulos inexistentes.
- [ ] **Step 3: Implementar** os três arquivos e trocar `Distribuicao` por `BarList` no `PainelGestorScreen`, sem mudar textos nem labels.
- [ ] **Step 4: Rodar** — `npx jest src/api src/components src/screens/gestor` → PASS (os testes do painel continuam verdes sem alteração).
- [ ] **Step 5: Commit** — `git commit -m "feat: cliente de insights e componentes BarList e DonutChart"`

### Task 4: Tela "Insights da cidade" e entrada pelo painel

**Files:**
- Create: `src/screens/gestor/InsightsCidadeScreen.tsx`, `src/screens/gestor/InsightsCidadeScreen.test.tsx`
- Create: `app/(app)/insights.tsx`
- Modify: `app/(app)/_layout.tsx` (`<Stack.Screen name="insights" />`), `src/navigation/routes.ts` (`insights: '/insights'` + comentário da árvore)
- Modify: `src/screens/gestor/PainelGestorScreen.tsx` + `.test.tsx` (card de entrada)

**Interfaces:**
- Consumes: `obterInsightsRecife`, `InsightsRecife`, `BarList`, `DonutChart` (Task 3); `routes.insights`.
- Produces: rota `/insights`; o arquivo de rota renderiza `InsightsCidadeScreen` só para gestor (`isGestor(user)`) e, caso contrário, `<Redirect href={routes.inicio} />`.

Layout (de cima para baixo, `GradientBackground` + `ScreenHeader` com voltar, igual às telas em stack):
1. Título "Insights da cidade", subtítulo "Recife em demandas · Central 156 (EMLURB)".
2. Chips horizontais `insights-rpa-<todas|1..6>`: "Todas", "1 Centro" … "6 Sul". O selecionado fica destacado; trocar recarrega com o novo `rpa`.
3. 4 KPIs: "Solicitações" (total), "Atendidas" (taxa em %, uma casa decimal, vírgula; "—" se null), "Em andamento", "Bairros". Números com `toLocaleString('pt-BR')`.
4. Card "Distribuição por situação": `DonutChart` (centro = total, "solicitações") + legenda com cor, nome, total e %.
5. `BarList` "Serviços mais solicitados" (top 5, cor primária).
6. `BarList` "Demandas por RPA" (6 RPAs, a filtrada destacada em navy e as demais em `textSubtle` quando houver filtro).
7. `BarList` "Bairros com mais demandas" (top 8).
8. Card "De onde vêm esses dados" (`insights-fonte`): "API CKAN (Dados Abertos do Recife) → MongoDB Atlas (bronze) → transformação → Neon (prata) → ResolveAí"; "Situações de dd/mm/aaaa a dd/mm/aaaa · carga de dd/mm/aaaa via <origem_extracao>"; "Reconciliação: <total_bronze> no bronze = <total_final> no Neon"; e a nota "Retrato histórico de registros administrativos; não representa todas as necessidades da população."
- Estados: loading (`insights-loading`), erro com "Tentar novamente" (`insights-error`, `insights-retry`), pull-to-refresh, e total 0 → mensagem `insights-vazio` "Nenhuma solicitação nesta RPA." no lugar dos gráficos.

- [ ] **Step 1: Testes que falham** (`InsightsCidadeScreen.test.tsx`, mocks como em `PainelGestorScreen.test.tsx`, fixture com os números reais do Neon):
  - `shows the pipeline indicators`: `within(getByTestId('insights-total')).getByText('11.374')`, `getByText('67,4%')`, `getByLabelText('Iluminacao Publica: 4.118')`, `getByLabelText('6 Sul: 2.796')`, e `insights-fonte` contém `'11.374 no bronze = 11.374 no Neon'`.
  - `filters by RPA`: pressionar `insights-rpa-6` → `obterInsightsRecife` chamado com `6`.
  - `shows error and retries`: rejeição `'Dados da pipeline indisponíveis no momento. Tente novamente em instantes.'` → texto visível; `insights-retry` recarrega.
  - `shows empty state`: fixture com total 0 → `insights-vazio` e sem `DonutChart`.
  - `PainelGestorScreen.test.tsx`: `opens city insights`: pressionar `painel-insights` → `mockRouter.push` com `'/insights'`.
- [ ] **Step 2: Rodar e ver falhar** — `npx jest src/screens/gestor` → FAIL.
- [ ] **Step 3: Implementar** a tela, a rota, a entrada no `_layout`, `routes.insights` e o card `painel-insights` ("Insights da cidade" / "Dados abertos do Recife lidos da nossa pipeline") no painel, acima do botão "Analisar demandas".
- [ ] **Step 4: Rodar tudo** — `npx jest` e `npx tsc --noEmit` → verdes.
- [ ] **Step 5: Ver no app** — `npx expo start` apontando para o backend local (Task 2, Step 5), login como gestor, abrir Insights, trocar RPA, conferir os números contra o Neon.
- [ ] **Step 6: Commit** — `git commit -m "feat: tela Insights da cidade para o gestor com dados da pipeline de dados abertos"`

### Task 5: Documentação, deploy e OTA

**Files:**
- Modify: `README.md` (seção "Insights da cidade (desafio de dados)" com o caminho do dado e a rota), plano e spec já no repo.

- [ ] **Step 1:** README atualizado. Commit `docs: caminho do dado da pipeline ate a tela de insights` e `git push` (app).
- [ ] **Step 2 (com o usuário):** cadastrar `NEON_DATABASE_URL` no Render e esperar o redeploy; verificar com `curl` autenticado em `https://smart-city-z13w.onrender.com/api/insights/recife` → 200.
- [ ] **Step 3:** `npm run update:preview` (e `update:production`, se for o canal do APK) → a tela chega ao APK por OTA; conferir no aparelho.
