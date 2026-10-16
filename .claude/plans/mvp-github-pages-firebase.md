# Plano: MVP no GitHub Pages com Firebase

## Objetivo
Transformar o protótipo `capsulas.html` (feito como Artifact no claude.ai) num site estático publicado no **GitHub Pages**, com os dados no **Firebase (Firestore)** para sincronizar entre aparelhos (celular e PC). Nenhuma dependência da infraestrutura do claude.ai.

## Princípio: MVP sempre
Entregar o menor conjunto que resolve o problema: **catálogo funcionando, sincronizado entre aparelhos, publicado**. Tudo que não for necessário para isso vai para a seção "Roadmap". Na dúvida entre duas soluções, escolher a mais simples. Sem build, sem framework, sem bibliotecas além do Firebase SDK e das Google Fonts.

## Decisões tomadas
| Tema | Decisão |
| --- | --- |
| Armazenamento | **Firebase Firestore**. Substitui o `localStorage` como fonte dos itens. |
| Login | **Firebase Auth com Google** (`signInWithPopup`). Um clique, sem senha para gerenciar. |
| Escopo dos dados | Por usuário: `users/{uid}/capsulas/{id}`. Cada conta vê só os próprios itens. |
| SDK | Firebase JS SDK modular via CDN (`https://www.gstatic.com/firebasejs/<versão>/firebase-*.js`), versão fixa, com `<script type="module">`. Sem npm. |
| Hospedagem | GitHub Pages, deploy pela branch `master`, pasta raiz. URL: https://dancarvalhodev.github.io/gerenciador-de-capsulas/ |
| Arquivos | Separados por categoria em pastas: `css/`, `js/`, `firebase/`, `docs/`. Na raiz ficam só o `index.html` (o GitHub Pages exige) e os arquivos do repositório (README, CLAUDE.md, configs). |
| Documentação | Pasta `docs/` em português simples, com analogias, explicando o Firebase e como o código funciona. Comentários longos saem do JS e vão para a documentação; no código ficam comentários curtos. |
| Persistência | **Só Firebase. Nada de `localStorage`** (nem para preferências). |
| Modo da máquina | Campo `maquina` (`"auto" \| "manual"`) no documento `users/{uid}`; sincroniza entre aparelhos. Padrão `"auto"`. |
| Filtro | Não é persistido: o app sempre abre em "Todas". |
| Exportar/Importar JSON | **No Roadmap**: o Firestore já resolve a troca entre aparelhos; o backup vem depois. |

## Estrutura de arquivos
Estrutura alvo, aplicada no passo 4:
```
index.html                  # só marcação; fica na raiz porque o GitHub Pages abre o index.html da raiz
css/
  styles.css                # todo o visual
js/
  app.js                    # estado da tela e reação aos cliques
  firebase.js               # único arquivo que fala com o Firebase
  firebase-config.js        # endereço público do projeto no Firebase
  dados.js                  # valores fixos e lista pronta de sabores
  html.js                   # funções que montam o HTML de cada pedaço da tela
firebase/
  firestore.rules           # regras de segurança (cópia do que está publicado no console)
docs/
  firebase.md               # o Firebase explicado com analogias (casa, porteiro, armário)
  como-o-app-funciona.md    # caminho do clique até o dado salvo, arquivo por arquivo
README.md                   # o que é, link do site, como rodar e links para docs/
CLAUDE.md
.prettierrc
.gitignore
.claude/plans/
```
Por que essa divisão: abrir a raiz e entender o projeto em segundos. Cada pasta tem um único assunto: aparência (`css/`), comportamento (`js/`), configuração do Firebase que não é código do site (`firebase/`) e explicações (`docs/`).

Não usar a opção "pasta `/docs`" do GitHub Pages: ela publicaria a documentação como site. O Pages continua publicando a raiz da `master`. Os arquivos de `docs/` também ficam acessíveis pela URL do site, o que é inofensivo.

## Camada de dados
Implementada no passo 3. `acessarCapsulasDoUsuario(uid)` (em `firebase.js`) entrega 4 ações sobre `users/{uid}/capsulas`:

```js
observar(aoMudar, aoFalhar)  // entrega a lista agora e a cada mudança; devolve a função que para de observar
criar(dados)                 // cria uma ficha (sabor)
atualizar(id, campos)        // altera só os campos enviados
excluir(id)                  // apaga a ficha
```

- Estoque (`−`, `+`, "Fazer uma" e lista pronta) usa `somarNoArmario(n)` (`increment()` do Firestore), para não perder alterações quando dois aparelhos mexem ao mesmo tempo.

### Preferência da máquina
- Documento `users/{uid}` com `{ maquina: "auto" | "manual" }`.
- `observarPreferencias` atualiza o seletor quando a máquina muda em qualquer aparelho; se o documento não existir, usa `"auto"` sem gravar.
- `salvarPreferencias` grava com `merge: true`, alterando só o campo enviado.
- No logout, as duas observações (cápsulas e preferências) são desligadas.

### Modelo de dados (um documento por sabor, sem mudança)
```json
{
  "nome": "Cappuccino",
  "categoria": "cafe | leite | choco | cha",
  "temp": "quente | frio",
  "passos": [
    { "rotulo": "Leite", "barras": 4 },
    { "rotulo": "Café", "barras": 2 }
  ],
  "estoque": 6,
  "nota": ""
}
```
O `id` é o id do documento no Firestore, não um campo gravado.

### Regras do Firestore (`firestore.rules`)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /capsulas/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## Fluxo de login
- Ao abrir: `observarLogin`.
  - Sem usuário → esconder catálogo e toolbar; mostrar o cartão "Entrar com Google".
  - Com usuário → `acessarCapsulasDoUsuario`, começar a observar cápsulas e preferências e desenhar a tela.
- No cabeçalho, perto do seletor de máquina: e-mail do usuário + botão "Sair" (desliga as observações, chama `sairDaConta`, limpa a lista).
- Erros de gravação continuam aparecendo como hoje (botão "Não salvou. Tente de novo").

## Passos
1. ✅ **Separar arquivos**: `index.html` com estrutura completa (`<!doctype html>`, `<html lang="pt-BR">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>`), `styles.css` e `app.js`. Remover a meta `claude:viewport-fit-sides`. Conferir que o app abre igual ao protótipo (ainda com `localStore`) antes de mexer nos dados.
2. ✅ **Configurar o Firebase** (feito pelo usuário no console; o Claude orienta):
   - criar projeto no plano gratuito (Spark);
   - adicionar um app Web e copiar o `firebaseConfig` para `firebase-config.js`;
   - Authentication → ativar provedor Google → em "Domínios autorizados" adicionar `<usuario>.github.io` (`localhost` já vem autorizado);
   - Firestore → criar banco em modo produção e colar o conteúdo de `firestore.rules` (depois do passo 4: `firebase/firestore.rules`).
   - Google Cloud → Credenciais → chave de API do navegador → restrição por sites: `http://localhost:8000/*`, `https://dancarvalhodev.github.io/*`, `https://minhas-capsulas.firebaseapp.com/*` (este último é necessário para o popup de login). O alerta de "leaked key" do GitHub é esperado e foi fechado: a chave Web do Firebase é pública por natureza.

   **Critério para guiar este passo:** o usuário não conhece Firebase. Ao orientar:
   - Explicar com palavras do dia a dia, em frases curtas, sem jargão. Quando um termo técnico for inevitável (é o nome do botão na tela), dizer o que ele significa logo em seguida.
   - Antes de cada item, dizer em uma frase **para que ele serve** e usar uma analogia. Sugestões:
     - *Projeto do Firebase* = a casa onde ficam todas as coisas do app.
     - *Firestore* = um armário: a *coleção* é uma gaveta e cada *documento* é uma ficha dentro dela (uma ficha por sabor de cápsula).
     - *Authentication / login com Google* = o porteiro, que confere quem está entrando usando a conta Google.
     - *Regras (`firestore.rules`)* = a lista que o porteiro segue: "cada pessoa só abre a própria gaveta".
     - *Domínios autorizados* = os endereços de onde o porteiro aceita visitas (o site no GitHub Pages e o computador local).
     - *`firebaseConfig`* = o endereço da casa, não a chave. Pode ficar público; quem protege os dados são as regras.
     - *Plano Spark* = o plano grátis, com um limite de uso bem acima do que um app pessoal precisa.
   - Um passo de cada vez: dizer onde clicar, o que deve aparecer na tela e esperar o usuário confirmar antes de seguir.
   - Se algo der errado, explicar o que aconteceu e como resolver, também sem jargão.
3. ✅ **Trocar o armazenamento**: Firebase com login Google, preferência da máquina em `users/{uid}`, código do claude.ai e `localStorage` removidos. JS dividido em módulos com nomes claros e comentários. (Falta o teste no navegador, que fica no passo 6.)
4. **Organizar os arquivos e escrever a documentação** (README junto). **Este é o próximo passo.**

   ✅ **4a. Organizar por categoria** (só mover; o comportamento não muda):
   - Mover os arquivos para a estrutura alvo descrita em "Estrutura de arquivos": `css/`, `js/`, `firebase/` e `docs/`.
   - Ajustar os caminhos: no `index.html`, `css/styles.css` e `js/app.js`. Os imports entre arquivos de `js/` continuam iguais, porque ficam todos na mesma pasta.
   - Criar um `.gitignore` mínimo (`.DS_Store`, `Thumbs.db`, `.vscode/`).
   - Atualizar no `CLAUDE.md` os caminhos, a estrutura e o comando do Prettier.
   - Conferir: o servidor local entrega todos os arquivos (status 200) e a sintaxe dos módulos continua válida.

   ✅ **4b. Documentação** em `docs/`, escrita a partir dos comentários atuais do JS:
   - `docs/firebase.md`: o Firebase explicado para quem nunca usou.
     1. A analogia (casa, endereço, porteiro, armário, gaveta, ficha) numa tabela curta: termo do Firebase → analogia → onde aparece no código.
     2. O endereço (`firebase-config.js`): por que pode ser público e a restrição por site no Google Cloud.
     3. O porteiro: login com Google, domínios autorizados e o que acontece ao entrar e sair.
     4. As regras (`firebase/firestore.rules`): linha a linha, mais a tabela "Situação → o porteiro deixa?".
     5. O armário: gaveta `users/{id}` (preferências) e fichas `users/{id}/capsulas` (sabores), com o modelo de uma ficha.
     6. `firebase.js` função por função: trecho curto de código, o que faz e a analogia.
     7. Sincronização: como "observar" faz a mudança no celular aparecer no PC, e por que o estoque usa "some 1" em vez de "agora é 5".
     8. Onde cada coisa fica no console do Firebase e no Google Cloud, caso precise mexer de novo.
   - `docs/como-o-app-funciona.md`: o caminho de um clique.
     1. Mapa dos arquivos: o papel de cada um em uma frase.
     2. O que acontece ao abrir a página: login, observar e desenhar a tela.
     3. Exemplo completo: clicar em "Fazer uma" → `app.js` → `firebase.js` → armário → observação → tela redesenhada.
     4. Onde mexer para tarefas comuns: adicionar um sabor à lista pronta, mudar o limite "Acabando", mudar textos.
   - `README.md`: o que é o app, link do site publicado, como rodar localmente e links para os dois arquivos de `docs/`. Curto.

   **Critério de escrita da documentação** (vale para todo `docs/` e o README):
   - Português simples, frases curtas, sem jargão. Termo técnico inevitável é explicado na hora.
   - Toda seção sobre o Firebase usa a analogia casa / porteiro / armário / gaveta / ficha.
   - Formato de cada trecho: **código curto (poucas linhas) → o que faz → analogia**. Nada de parágrafos longos.
   - Detalhado no conteúdo, enxuto na forma: preferir tabelas e listas a texto corrido. Cada arquivo de `docs/` deve ser lido em até ~5 minutos.
   - Não repetir a mesma explicação em dois lugares: o README aponta para `docs/`.

   **4c. Enxugar os comentários do JS** (entregue, aguardando conferência):
   - As explicações longas (como o cabeçalho de `firebase.js` com a analogia) passam para `docs/firebase.md`.
   - No código ficam comentários curtos, de uma linha, dizendo o que o trecho faz ou por quê, mais um aviso no topo de cada arquivo apontando para a doc. Exemplo: `// Explicado em docs/firebase.md`.
   - Os nomes claros continuam: a doc complementa o código, não substitui nomes ruins.
5. **Publicar** (feito pelo usuário): o repositório já existe em https://github.com/dancarvalhodev/gerenciador-de-capsulas. Em Settings → Pages, escolher "Deploy from a branch", branch `master`, pasta `/ (root)`. Cada push na `master` atualiza o site.
6. **Testar** no navegador (localmente via `python3 -m http.server` e depois na URL do Pages):
   - login e logout;
   - adicionar pela lista;
   - editar e excluir;
   - "Fazer uma", `−` e `+`;
   - sincronização: alterar num aparelho/aba e ver mudar no outro;
   - filtros e busca;
   - troca do modo da máquina (e ver mudar no outro aparelho/aba);
   - nenhuma chave nossa no `localStorage` (DevTools → Application);
   - tema escuro;
   - largura de celular (cerca de 375 px).

## Roadmap
- Exportar/Importar JSON como backup.
