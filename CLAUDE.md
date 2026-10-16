# CLAUDE.md

## Projeto
"Minhas Cápsulas": catálogo pessoal de cápsulas Dolce Gusto (como preparar cada uma + estoque). Site estático no **GitHub Pages**, dados no **Firebase Firestore** com login Google, sincronizando entre aparelhos. Interface e código em **português (pt-BR)**.

Plano atual: [`.claude/plans/mvp-github-pages-firebase.md`](.claude/plans/mvp-github-pages-firebase.md). Leia antes de implementar e mantenha-o atualizado quando uma decisão mudar.

## Regras de trabalho
- **MVP sempre.** Faça o mínimo que entrega o objetivo. Ideias extras vão para o "Roadmap" no plano, não para o código.
- **Sem build e sem npm.** HTML, CSS e JS vanilla. Única dependência externa: Firebase JS SDK modular via CDN do gstatic, com versão fixa, e Google Fonts.
- **Arquivos separados por categoria** (módulos ES, sem build): marcação em `index.html` (na raiz, porque o GitHub Pages abre o `index.html` da raiz), estilos em `css/styles.css`, regras de segurança em `firebase/firestore.rules` e o JS em `js/`, dividido por assunto (config em `js/firebase-config.js`):
  - `firebase.js`: único lugar que importa o SDK (login, preferências em `users/{uid}`, `acessarCapsulasDoUsuario`);
  - `dados.js`: constantes e a lista pronta `LISTA_PRONTA`;
  - `html.js`: funções puras que montam HTML (`escaparHTML`, `cartaoDoSaborHTML`, `linhaDaListaProntaHTML`…);
  - `app.js`: estado, `desenharTela()` e eventos.
  Não colocar `<style>` nem `<script>` inline no HTML.
- **Código legível para quem não conhece Firebase.** Nomes em português que dizem a ação (`entrarComGoogle`, `observarPreferencias`, `quantidadeEmEstoque`), sem abreviações de uma letra fora de callbacks curtos. Comentários curtos, de uma linha: o *porquê* e as chamadas ao Firebase, usando a analogia casa / porteiro / armário / gaveta / ficha. Explicações longas ficam em `docs/` (`docs/firebase.md` tem a tabela da analogia; `docs/como-o-app-funciona.md`, o caminho de um clique), e cada arquivo de `js/` aponta para a sua no topo. Ao mudar um comportamento documentado, atualize o documento junto.
- **O Claude NUNCA faz commit (nem push) por conta própria.** Quando pedido, apenas gera a mensagem; quem commita é o usuário. Formato: gitmoji + resumo em português, corpo com tópicos e, no fim, `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
## Estado atual
- Passo 1 do plano concluído: o protótipo `capsulas.html` foi separado em `index.html`, `styles.css` e `app.js`, sem mudar o comportamento.
- Passo 3 implementado (falta o usuário testar no navegador): Firebase SDK 12.4.0 via gstatic, login Google por popup, `acessarCapsulasDoUsuario` em `users/{uid}/capsulas`, máquina em `users/{uid}.maquina`, estoque com `increment()` (exportado como `somarNoArmario`). Código do claude.ai e `localStorage` removidos.
- Telas: `#login` (deslogado), `#app` + `#conta` no cabeçalho (logado). A regra `[hidden] { display: none !important; }` no CSS é necessária porque `.empty` e `.app` usam `display: grid`.
- Passo 2 concluído: projeto Firebase criado, app Web registrado (`firebase-config.js`), login Google ativado, `dancarvalhodev.github.io` nos domínios autorizados, Firestore criado em `southamerica-east1` no modo produção e `firestore.rules` publicado no console.
- Passo 4 concluído: arquivos em `css/`, `js/` e `firebase/` (só `index.html` na raiz), `.gitignore`, documentação em `docs/firebase.md` e `docs/como-o-app-funciona.md`, README curto e comentários do JS de uma linha apontando para `docs/`.
- Passo 5 concluído: GitHub Pages ativo pela `master`, pasta raiz, em https://dancarvalhodev.github.io/gerenciador-de-capsulas/. O site abre e o login Google funciona. Cada push na `master` atualiza o site.
- Próximo: passo 6 (teste completo no navegador, que cobre também os passos 3 e 4).
- Repositório: https://github.com/dancarvalhodev/gerenciador-de-capsulas, branch `master`.

## Arquitetura (alvo)
- **`acessarCapsulasDoUsuario(uid)`** (em `firebase.js`) isola o armazenamento com 4 ações: `observar(aoMudar, aoFalhar)`, `criar(dados)`, `atualizar(id, campos)`, `excluir(id)`, sobre `users/{uid}/capsulas`. O `app.js` só fala com essa interface.
- Ajustes de estoque usam `somarNoArmario(n)` (`increment()` do Firestore) para não perder atualizações concorrentes.
- Render por template strings + `innerHTML`; **todo texto do usuário passa por `escaparHTML()`**. Eventos por delegação (`data-act`, `data-f`, `data-close`…).
- **Só Firebase, sem `localStorage`.** O modo da máquina fica no campo `maquina` do documento `users/{uid}` (sincroniza; padrão `"auto"`). O filtro não é persistido (abre em "Todas").
- Constantes (`dados.js`): `NOMES_DAS_CATEGORIAS`, `ML_POR_BARRA = 30`, `LIMITE_ACABANDO = 2`, `LISTA_PRONTA` (valores estimados).
- Tema: tokens CSS em `:root`, modo escuro via `prefers-color-scheme` e `[data-theme]`.

### Modelo de um item
```json
{ "nome": "Cappuccino", "categoria": "cafe|leite|choco|cha", "temp": "quente|frio",
  "passos": [{ "rotulo": "Leite", "barras": 4 }, { "rotulo": "Café", "barras": 2 }],
  "estoque": 6, "nota": "" }
```
`id` = id do documento no Firestore. `barras` vai de 1 a 7.

## Firebase
- Projeto: `minhas-capsulas`. GitHub do usuário: `dancarvalhodev` (Pages em `dancarvalhodev.github.io`, que deve estar nos domínios autorizados do Auth).
- `js/firebase-config.js` contém chaves públicas do app Web; pode ser commitado. O GitHub acusa a `apiKey` como vazada: é falso positivo (alerta fechado). A chave está restrita por site no Google Cloud (localhost:8000, dancarvalhodev.github.io, minhas-capsulas.firebaseapp.com); ao testar em outra porta ou domínio, é preciso incluí-lo lá. A segurança fica em `firebase/firestore.rules` (só o dono do `uid` lê/escreve `users/{uid}` e `users/{uid}/capsulas`).
- Config do console (provedor Google, domínios autorizados, regras) é feita pelo usuário; o Claude orienta, não tem acesso.
- **O usuário não conhece Firebase.** Ao explicar qualquer coisa do Firebase, use português simples, sem jargão, com analogias e um passo de cada vez (veja o critério no passo 2 do plano).

## Formatação
- Prettier com `.prettierrc` (largura 100): `npx --yes prettier@3.3.3 --write index.html css js`. Não vira dependência do projeto.
- `LISTA_PRONTA` em `dados.js` usa `// prettier-ignore` para manter um sabor por linha.
- Templates HTML em `html.js` ficam em várias linhas, um elemento por linha, para facilitar a revisão.

## Rodar e testar
- `python3 -m http.server 8000` na raiz e abrir `http://localhost:8000` (módulos ES e login exigem HTTP).
- Não há testes automatizados. Verifique no navegador: login/logout, adicionar pela lista, editar/excluir, "Fazer uma" e −/+, sincronização entre duas abas, filtros e busca, modo da máquina, tema escuro, largura de 375 px.
