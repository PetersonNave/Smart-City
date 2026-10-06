# Entrega Unidade 1 - Desenvolvimento Mobile

## Membros do Projeto
- ANDRÉ FELIPE DA SILVA BRAGA
- DAYVID CRISTIANO VIANA DA SILVA
- DEYVISON MUNIZ CONRADO
- JENIFFER CRISTINE LOPES DA CONCEICAO
- LETICIA GABRIELLA DA COSTA SILVA
- LEVI MORAES MOURA ANDRADE
- LUIS HENRIQUE FACUNDE DA SILVA
- MANUELE MACEDO PEREIRA DA SILVA
- MARIA APARECIDA EVELLIN RODRIGUES DA SILVA
- PETERSON JESUS FEITOSA DE MELO
- RHALDNEY ROBERT CHAVES DINIZ
- VICTOR CÉSAR MATIAS DA SILVA

---

## Checklist de Especificações de Entrega

- [x] **Aplicação em React Native utilizando Expo com build para Android e iOS, somente:**
O projeto foi inicializado e estruturado usando as versões mais recentes do Expo (v57) e React Native. O arquivo `app.json` possui configurações exclusivas focadas nos builds nativos para Android (`adaptiveIcon`) e iOS (`supportsTablet`).

- [x] **Nada de habilitar o framework para fazer deploy de aplicação PWA ou web:**
As bibliotecas core necessárias para rodar ou compilar o projeto para a web/PWA no Expo (como `react-native-web` e `@expo/metro-runtime`) **não** estão instaladas no `package.json`. Embora existam resquícios de boilerplates padrões do Expo (como script `"web": "expo start --web"` no package.json ou configuração de ícone de favicon no `app.json`), o ecossistema web não está habilitado.

- [x] **Arquitetura MVVM ou MVC:**
A estrutura de pastas deixa claro uma separação elegante de responsabilidades, dividindo o projeto entre a camada de apresentação (`src/components`, `src/screens` e rotas do `app/`), domínio (`src/domain` como models) e acesso a dados e backend (`src/api`). A lógica flui num modelo MVVM, onde as telas e hooks customizados coordenam o estado da interface.

- [x] **Integração com o backend:**
Existem integrações HTTP implementadas via `axios` na pasta `src/api`. O arquivo `src/api/client.ts` centraliza as requisições e a autenticação, conversando com as rotas como `/api/demandas`.

- [x] **Utilização de GPS através do Expo Location:**
A dependência `expo-location` está instalada e configurada com a permissão correta (`locationWhenInUsePermission`) no `app.json`. Seu uso prático pode ser verificado em hooks customizados, como o `src/hooks/useCurrentAddress.ts`.

- [x] **Utilização da camera do dispositivo através do Expo Camera:**
A dependência `expo-camera` também encontra-se instalada, com as devidas permissões declaradas, e sendo ativamente importada no componente customizado `src/components/CameraCapture/index.tsx` usando o `<CameraView>`.

- [x] **CRUD com criação, pesquisa, atualização e remoção das ocorrências:**
As 4 operações básicas encontram-se completas e mapeadas no arquivo `src/api/demandas.ts` através das funções `criarDemanda` (Create), `listarDemandas` / `obterDemanda` (Read), `atualizarDemanda` (Update) e `excluirDemanda` (Delete).

- [x] **Listagem das ocorrências utilizando FlatList ou SectionList do React Native:**
O React Native foi devidamente importado e há a clara utilização do componente `FlatList` na listagem principal das demandas, visível no arquivo `src/screens/demandas/DemandasListaScreen.tsx`.

- [x] **Navegação entre telas utilizando Expo Router:**
Toda a roteirização do sistema é gerenciada pela dependência `expo-router`. A arquitetura baseia-se em arquivos no diretório `app/` (como os grupos `(app)` e `(auth)`) em sinergia com os hooks nativos do roteador como `useRouter`.

- [x] **Persistência de estado utilizando os hooks nativos do React Native: useState e useEffect:**
Extensivo uso de `useState` e `useEffect` por toda a base de código, englobando componentes de UI, telas e contextos (por exemplo, dentro de `src/auth/AuthContext.tsx` e `src/components/CameraCapture`).

---

## Uso de Inteligência(s) Artificial(is) no Projeto
- [x] Utilização de IA como Claude Code para desenvolvimento do projeto
- [x] Uso do set de skills **superpowers** para o desenvolvimento Spec-Driven Development
- [ ] Declaração de uso de IA no projeto de acordo com as condições estabelecidas no plano de ensino

---

### Uso de Inteligência Artificial na Disciplina

Nesta disciplina, o professor utiliza ferramentas de Inteligência Artificial (IA) como apoio às atividades de ensino — por exemplo, na geração de resumos, imagens ilustrativas de conceitos e mapas mentais —, sempre com revisão
crítica prévia do conteúdo antes de sua utilização em sala de aula. O uso de IA pelos estudantes nas atividades desta disciplina é permitido mediante a declaração, prevista na Política de Governança de IA do CESAR, em atividades de geração de rascunho pela IA seguida de análise crítica (curadoria) do estudante, que deverá emitir parecer próprio sobre os acertos e eventuais erros, imprecisões ou vieses nas informações fornecidas pela ferramenta.

Aplicam-se as seguintes condições, sem as quais o uso não é autorizado:
- **Ferramentas autorizadas**: somente poderão ser utilizadas ferramentas de IA constantes no Catálogo de IA do CESAR, com status de aprovação vigente. O uso de ferramentas não catalogadas é proibido.
- **Proteção de dados**: é expressamente proibida a inserção de dados pessoais, dados pessoais sensíveis ou qualquer informação que permita identificar pessoas (próprias, de colegas, de terceiros ou de participantes de pesquisa) nas ferramentas de IA.
- **Autoria e responsabilidade humana**: o conteúdo gerado pela IA não pode ser apresentado como produção própria do estudante. Cabe ao estudante revisar criticamente o resultado, validar informações e assumir integral responsabilidade pela versão final entregue.
- **Declaração obrigatória**: todo uso de IA nesta atividade deve ser declarado no formato narrativo abaixo, informando a ferramenta utilizada, a finalidade, a etapa da atividade, o tipo de contribuição, a confirmação de que não houve tratamento de dados pessoais, e a confirmação de revisão crítica e responsabilidade humana sobre o resultado final.

Qualquer uso de IA fora do escopo acima descrito (por exemplo, em atividades avaliativas não expressamente autorizadas) é considerado **uso condicionado ou proibido**, conforme o caso, e deverá ser previamente consultado com o professor.

Modelo de declaração a ser incluído na atividade quando houver uso de IA:
_Declaro que utilizei a(s) ferramenta(s) de Inteligência Artificial [informar nome e versão da ferramenta, conforme constante no Catálogo de IA do CESAR] nesta atividade, com a finalidade de gerar um rascunho sobre [tema], sobre o qual realizei análise crítica (curadoria) das informações apresentadas. Não tratei dados pessoais no uso desta ferramenta. Revisei criticamente o conteúdo gerado, identificando seus acertos e eventuais imprecisões, e assumo a responsabilidade integral pela versão final apresentada._