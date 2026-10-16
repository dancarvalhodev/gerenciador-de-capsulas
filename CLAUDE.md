# CLAUDE.md

## Projeto
"Minhas Cápsulas": catálogo pessoal de cápsulas Dolce Gusto (como preparar cada uma + estoque). Site estático no **GitHub Pages**, dados no **Firebase Firestore** com login Google, sincronizando entre aparelhos. Interface e código em **português (pt-BR)**.

Plano atual: [`.claude/plans/mvp-github-pages-firebase.md`](.claude/plans/mvp-github-pages-firebase.md). Leia antes de implementar e mantenha-o atualizado quando uma decisão mudar.

## Regras de trabalho
- **MVP sempre.** Faça o mínimo que entrega o objetivo. Ideias extras vão para "Depois do MVP" no plano, não para o código.
- **Sem build e sem npm.** HTML, CSS e JS vanilla. Única dependência externa: Firebase JS SDK modular via CDN do gstatic, com versão fixa, e Google Fonts.
- **Arquivos separados**: marcação em `index.html`, estilos em `styles.css`, lógica em `app.js`, config em `firebase-config.js`. Não colocar `<style>` nem `<script>` inline no HTML.
- **O Claude NUNCA faz commit (nem push) por conta própria.** Quando pedido, apenas gera a mensagem; quem commita é o usuário. Formato: gitmoji + resumo em português, corpo com tópicos e, no fim, `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Não adicionar logotipo nem identidade visual da Nescafé/Dolce Gusto; não fazer scraping do site da marca; cápsulas NEO estão fora do escopo.

## Estado atual
- Passo 1 do plano concluído: o protótipo `capsulas.html` foi separado em `index.html`, `styles.css` e `app.js`, sem mudar o comportamento.
- `app.js` ainda tem o código herdado do claude.ai: `dbStore`/`window.claude`, `localStore`, `lsGet`/`lsSet` e o `#banner` amarelo. Tudo isso sai no passo 3, quando o Firestore entrar.
- Passo 2 concluído: projeto Firebase criado, app Web registrado (`firebase-config.js`), login Google ativado, `dancarvalhodev.github.io` nos domínios autorizados, Firestore criado em `southamerica-east1` no modo produção e `firestore.rules` publicado no console.
- A branch local é `master`; o deploy do Pages será pela `main`.

## Arquitetura (alvo)
- **`store`** isola o armazenamento com 4 métodos: `subscribe(cb)`, `add(dados)`, `update(id, patch)`, `remove(id)`. A UI só fala com essa interface. Implementação: `firestoreStore(db, uid)` sobre `users/{uid}/capsulas`.
- Ajustes de estoque usam `increment()` do Firestore para não perder atualizações concorrentes.
- Render por template strings + `innerHTML`; **todo texto do usuário passa por `esc()`**. Eventos por delegação (`data-act`, `data-f`, `data-close`…).
- **Só Firebase, sem `localStorage`.** O modo da máquina fica no campo `maquina` do documento `users/{uid}` (sincroniza; padrão `"auto"`). O filtro não é persistido (abre em "Todas").
- Constantes: `CATS`, `ML_POR_BARRA = 30`, `BAIXO = 2`, `MODELOS` (lista pronta, valores estimados).
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
- `firebase-config.js` contém chaves públicas do app Web; pode ser commitado. A segurança fica em `firestore.rules` (só o dono do `uid` lê/escreve `users/{uid}` e `users/{uid}/capsulas`).
- Config do console (provedor Google, domínios autorizados, regras) é feita pelo usuário; o Claude orienta, não tem acesso.
- **O usuário não conhece Firebase.** Ao explicar qualquer coisa do Firebase, use português simples, sem jargão, com analogias e um passo de cada vez (veja o critério no passo 2 do plano).

## Formatação
- Prettier com `.prettierrc` (largura 100): `npx --yes prettier@3.3.3 --write index.html styles.css app.js`. Não vira dependência do projeto.
- `MODELOS` em `app.js` usa `// prettier-ignore` para manter um sabor por linha.

## Rodar e testar
- `python3 -m http.server 8000` na raiz e abrir `http://localhost:8000` (módulos ES e login exigem HTTP).
- Não há testes automatizados. Verifique no navegador: login/logout, adicionar pela lista, editar/excluir, "Fazer uma" e −/+, sincronização entre duas abas, filtros e busca, modo da máquina, tema escuro, largura de 375 px.
