# Telas de demandas

## Navegação (Expo Router)

As rotas ficam em `/app` (um arquivo por tela); as telas em si continuam em `src/screens`.

```
app/
 ├─ _layout.tsx               fontes, providers e proteção por sessão
 ├─ (auth)/                   só visitantes: /login, /cadastro
 └─ (app)/                    só usuários logados
     ├─ (tabs)/               abas com a TabBar do Figma
     │   ├─ index.tsx         /                       Início (atalho "Registrar nova demanda")
     │   ├─ mapa.tsx          /mapa                   placeholder
     │   ├─ demandas/         /demandas               lista
     │   │                    /demandas/:id           detalhe
     │   │                    /demandas/:id/editar    edição (com tab bar, como no Figma)
     │   └─ perfil.tsx        /perfil                 placeholder
     ├─ nova-demanda.tsx      /nova-demanda           sem tab bar, como no Figma
     └─ demanda-enviada.tsx   /demanda-enviada?id=
```

- **Proteção:** o layout raiz usa `Stack.Protected` com o status do `AuthContext`. Visitante
  que abre qualquer rota do app vê o Login; ao logar/deslogar (ou se o refresh do token
  falhar no meio do uso) o Expo Router troca de grupo sozinho. Enquanto a sessão é
  restaurada, aparece a tela de Loading do Figma.
- **Parâmetros de URL são strings**: as telas recebem ids (`/demandas/7`) e buscam os dados
  na API. Ids inválidos (`/demandas/abc`) mostram "Demanda não encontrada" sem chamar a API.
  Os caminhos ficam centralizados em `src/navigation/routes.ts`.
- Abrir `/demandas/:id` direto (ex.: "Acompanhar demanda") coloca a lista embaixo
  (`initialRouteName` do layout de demandas), então "voltar" leva à lista.
- A tab bar (`src/components/TabBar`) fica sobreposta ao conteúdo. Toda tela de aba que
  rola deve reservar `useTabBarInset()` de espaço embaixo.

## Lista (`DemandasListaScreen`)

- `GET /api/demandas?page=&per_page=10`. O backend já filtra: cidadão vê só as próprias,
  gestor vê todas (o título muda para "Analisar Demandas" no caso do gestor).
- Recarrega ao voltar o foco para a aba (ex.: depois de criar uma demanda), tem
  pull-to-refresh e carrega a próxima página ao chegar no fim da lista.
- **Pesquisa:** campo de busca (título, descrição ou endereço; o backend ignora maiúsculas
  e acentos) com debounce de 400 ms, e filtro de status no controle segmentado do Figma
  (Todas / Pendente / Em análise / Concluída / Recusada). Busca e filtro rodam no servidor
  (`GET /api/demandas?q=&status=`), então funcionam com a paginação. Respostas de buscas
  antigas que chegam atrasadas são descartadas. Sem resultado, mostra "Limpar filtros".
- Cada card mostra a foto da demanda (ou o ícone da categoria, se não houver foto ou ela
  não carregar). Tocar no card expande categoria + descrição; o link expandido abre o detalhe.
- Lixeira: aparece só quando o backend permitiria excluir (`podeExcluir`: cidadão só
  exclui demanda pendente; gestor exclui qualquer uma). Confirma no modal e mostra o toast
  "Demanda excluída com sucesso!".
- Botão flutuante (+) abre a Nova demanda.

## Detalhe (`DemandaDetalheScreen`)

- `GET /api/demandas/{id}`: foto, título, status, descrição, localização, protocolo,
  categoria, data de registro e status atual. Pull-to-refresh busca o status atual.
- Botão "Editar Demanda" só aparece quando o backend permitiria editar (`podeEditar`:
  cidadão só edita a própria demanda enquanto pendente; gestor edita qualquer uma).
- Ao voltar da edição mostra "Demanda atualizada com sucesso!" e, se o endereço mudou,
  o rótulo "Localização (atualizada)" — como no frame do Figma. O resultado chega pela URL
  (`router.dismissTo` volta ao detalhe que já está na pilha).

## Nova demanda (`NovaDemandaScreen`) → Demanda enviada

- **Foto:** "Tirar foto" abre a câmera do próprio app (`CameraCapture`, com **Expo Camera**:
  permissão, prévia ao vivo, troca de câmera frontal/traseira e confirmação "Usar foto" /
  "Tirar outra"). "Escolher da galeria" usa o `expo-image-picker`.
- Campos (`DemandaFormFields`, compartilhado com a edição): foto, título, categoria,
  descrição e localização (preenchida pelo GPS com reverse geocoding; se a permissão for
  negada, o usuário digita o endereço).
- Validação (`demandaForm.schema.ts`) usa os mesmos limites do backend. Erros 422 da API
  (ex.: título duplicado) voltam para o campo certo.
- Envio em duas etapas: `POST /api/demandas` com `{ titulo, descricao, categoria,
  localizacao, prioridade }` e depois `PUT /api/demandas/{id}/foto` (multipart, campo
  `foto`). Se só a foto falhar, a demanda já existe: a confirmação avisa que a foto pode
  ser adicionada em "Editar Demanda".
- A tela seguinte mostra o protocolo `#<ano>-<id com 5 dígitos>`, com atalhos para o
  detalhe e para o Início.
- Sair com o formulário preenchido pede confirmação ("Descartar demanda?").

## Editar demanda (`EditarDemandaScreen`)

- Carrega a demanda atual e preenche o formulário, com a foto atual e o selo "Alterar foto".
- "Atualizar" envia `PATCH /api/demandas/{id}` **só com os campos alterados** e, se uma foto
  nova foi escolhida, `PUT /api/demandas/{id}/foto`. Depois volta ao detalhe (`popTo`).
- Localização não é sobrescrita pelo GPS automaticamente: o link "Usar minha localização
  atual" busca o endereço quando o usuário pedir.
- Se só a foto mudou e o upload falhar, o erro aparece na própria tela. Se os dados foram
  salvos mas a foto falhou, o detalhe mostra um aviso em âmbar.
- Se a demanda saiu de pendente (ex.: o gestor já começou a analisar), a tela avisa que não
  pode mais ser editada. "Cancelar"/voltar com alterações pede "Descartar alterações?".

## Fotos no backend

- Salvas em `backend/uploads/demandas/` (fora do git; configurável por `UPLOAD_FOLDER`),
  com nome aleatório. JPG, PNG, WEBP ou HEIC até 8 MB, validados pelo conteúdo do arquivo.
- As demandas trazem `photoUrl` (URL absoluta com o host usado na requisição — no celular,
  o IP configurado em `EXPO_PUBLIC_API_URL`).

## Diferenças conscientes em relação ao Figma

| Figma | App | Motivo |
| :--- | :--- | :--- |
| Formulário sem campo "Título" | Campo "Título" adicionado | `titulo` é obrigatório e único no backend (5 a 120 caracteres). |
| Sem escolha de prioridade | Envia `prioridade: 'media'` | Obrigatória no backend; a triagem fica com o gestor. |
| Categorias "Infraestrutura Urbana" etc. | Categorias do backend (`ROAD_MAINTENANCE`, `PUBLIC_LIGHTING`...) com rótulos em PT | O backend só aceita esses valores. |
| "Toque para ver rota de atendimento no mapa" | "Toque para ver os detalhes da demanda" | A aba Mapa ainda é placeholder. |
| Botão voltar na lista | Oculto na raiz da aba | Não há para onde voltar na raiz de uma aba. |
| Demanda sem foto | Ícone da categoria no lugar da foto | Demandas criadas antes do upload existir (ou cuja foto falhou) não têm imagem. |
