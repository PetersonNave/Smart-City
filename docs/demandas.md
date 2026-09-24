# Telas de demandas

## Navegação

```
AppStack
 ├─ Tabs ─┬─ Início           (atalho "Registrar nova demanda")
 │        ├─ Mapa             (placeholder)
 │        ├─ Demandas (stack) ─┬─ DemandasLista
 │        │                    └─ DemandaDetalhe
 │        └─ Perfil           (placeholder)
 ├─ NovaDemanda               (sem tab bar, como no Figma)
 └─ DemandaEnviada
```

A tab bar (`src/components/TabBar`) fica sobreposta ao conteúdo. Toda tela de aba que
rola deve reservar `useTabBarInset()` de espaço embaixo.

## Lista (`DemandasListaScreen`)

- `GET /api/demandas?page=&per_page=10`. O backend já filtra: cidadão vê só as próprias,
  gestor vê todas (o título muda para "Analisar Demandas" no caso do gestor).
- Recarrega ao voltar o foco para a aba (ex.: depois de criar uma demanda), tem
  pull-to-refresh e carrega a próxima página ao chegar no fim da lista.
- Tocar no card expande categoria + descrição. O link do card expandido abre o detalhe.
- Lixeira: aparece só quando o backend permitiria excluir (`podeExcluir`: cidadão só
  exclui demanda pendente; gestor exclui qualquer uma). Confirma no modal e mostra o toast
  "Demanda excluída com sucesso!".
- Botão flutuante (+) abre a Nova demanda.

## Detalhe (`DemandaDetalheScreen`)

- `GET /api/demandas/{id}`: título, status, descrição, localização, protocolo, categoria,
  data de registro e status atual.

## Nova demanda (`NovaDemandaScreen`) → Demanda enviada

- Campos: foto, título, categoria, descrição e localização (preenchida pelo GPS com
  reverse geocoding; se a permissão for negada, o usuário digita o endereço).
- Validação (`NovaDemandaScreen.schema.ts`) usa os mesmos limites do `DemandaCreateSchema`
  do backend. Erros 422 da API (ex.: título duplicado) voltam para o campo certo.
- Envio: `POST /api/demandas` com `{ titulo, descricao, categoria, localizacao, prioridade }`.
- A tela seguinte mostra o protocolo `#<ano>-<id com 5 dígitos>`, com atalhos para o
  detalhe e para o Início.

## Diferenças conscientes em relação ao Figma

| Figma | App | Motivo |
| :--- | :--- | :--- |
| Foto real na miniatura/detalhe | Ícone da categoria | A API não armazena foto (não há campo no `DemandaCreateSchema`). A foto é exigida no formulário, mas **não é enviada** até o backend suportar upload. |
| Formulário sem campo "Título" | Campo "Título" adicionado | `titulo` é obrigatório e único no backend (5 a 120 caracteres). |
| Sem escolha de prioridade | Envia `prioridade: 'media'` | Obrigatória no backend; a triagem fica com o gestor. |
| Categorias "Infraestrutura Urbana" etc. | Categorias do backend (`ROAD_MAINTENANCE`, `PUBLIC_LIGHTING`...) com rótulos em PT | O backend só aceita esses valores. |
| "Toque para ver rota de atendimento no mapa" | "Toque para ver os detalhes da demanda" | A aba Mapa ainda é placeholder. |
| Botão "Editar Demanda" no detalhe | Não implementado | Fora do escopo desta entrega (o frame "Editar Demanda" existe no Figma). |
| Botão voltar na lista | Oculto na raiz da aba | Não há para onde voltar na raiz de uma aba. |
