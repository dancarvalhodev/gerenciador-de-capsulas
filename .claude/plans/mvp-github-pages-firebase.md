# Plano: MVP no GitHub Pages com Firebase

## Objetivo
Transformar o protótipo `capsulas.html` (feito como Artifact no claude.ai) num site estático publicado no **GitHub Pages**, com os dados no **Firebase (Firestore)** para sincronizar entre aparelhos (celular e PC). Nenhuma dependência da infraestrutura do claude.ai.

## Princípio: MVP sempre
Entregar o menor conjunto que resolve o problema: **catálogo funcionando, sincronizado entre aparelhos, publicado**. Tudo que não for necessário para isso vai para a seção "Depois do MVP". Na dúvida entre duas soluções, escolher a mais simples. Sem build, sem framework, sem bibliotecas além do Firebase SDK e das Google Fonts.

## Decisões tomadas
| Tema | Decisão |
| --- | --- |
| Armazenamento | **Firebase Firestore**. Substitui o `localStorage` como fonte dos itens. |
| Login | **Firebase Auth com Google** (`signInWithPopup`). Um clique, sem senha para gerenciar. |
| Escopo dos dados | Por usuário: `users/{uid}/capsulas/{id}`. Cada conta vê só os próprios itens. |
| SDK | Firebase JS SDK modular via CDN (`https://www.gstatic.com/firebasejs/<versão>/firebase-*.js`), versão fixa, com `<script type="module">`. Sem npm. |
| Hospedagem | GitHub Pages, deploy pela branch `main`, pasta raiz. |
| Arquivos | HTML, CSS e JS separados: `index.html`, `styles.css`, `app.js`, `firebase-config.js`. |
| Persistência | **Só Firebase. Nada de `localStorage`** (nem para preferências). |
| Modo da máquina | Campo `maquina` (`"auto" \| "manual"`) no documento `users/{uid}`; sincroniza entre aparelhos. Padrão `"auto"`. |
| Filtro | Não é persistido: o app sempre abre em "Todas". |
| Exportar/Importar JSON | **Fora do MVP**: o Firestore já resolve a troca entre aparelhos. |
| PWA / offline | **Fora do MVP**. |

## Estrutura de arquivos
```
index.html            # só marcação; <link> para styles.css e <script type="module" src="app.js">
styles.css            # todo o CSS que hoje está no <style> de capsulas.html
app.js                # lógica do app (render, editor, lista pronta, store do Firestore, login)
firebase-config.js    # export const firebaseConfig = { ... } (chaves públicas do projeto Firebase)
firestore.rules       # regras de segurança (referência; aplicadas pelo console do Firebase)
README.md
.gitignore
```
`capsulas.html` é removido depois que `index.html` estiver funcionando.

## Camada de dados
O código já isola o armazenamento num objeto `store` com a interface:

```js
store.subscribe(callback)   // chama callback(arrayDeItens) agora e a cada mudança
store.add(dados)            // cria um item
store.update(id, patch)     // mescla campos
store.remove(id)            // exclui
```

Implementar `firestoreStore(db, uid)` com essa mesma interface (o antigo `dbStore` é quase idêntico, só muda a origem da coleção):

- coleção: `collection(db, "users", uid, "capsulas")`
- `subscribe` → `onSnapshot`, mapeando `{ id: doc.id, ...doc.data() }`; devolver a função de cancelamento para usar no logout
- `add` → `addDoc`; `update` → `updateDoc`; `remove` → `deleteDoc`
- Estoque (`−`, `+`, "Fazer uma"): usar `increment(±1)` no `updateDoc` para evitar perda de atualização quando dois aparelhos mexem ao mesmo tempo. Na lista pronta, somar com `increment(n)` também.

Remover: `dbStore`, `localStore`, os helpers `lsGet`/`lsSet` e qualquer uso de `localStorage`, `window.claude`, o `#banner` e o CSS `.banner`.

### Preferência da máquina
- Documento `users/{uid}` com `{ maquina: "auto" | "manual" }`.
- Após o login: `onSnapshot(doc(db, "users", uid))` atualiza a variável `maquina` e o `<select>` e chama `render()`. Se o documento não existir, usar `"auto"` sem gravar.
- Ao mudar o `<select>`: `setDoc(doc(db, "users", uid), { maquina }, { merge: true })`.
- No logout, cancelar essa assinatura junto com a dos itens.

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
- Ao abrir: `onAuthStateChanged`.
  - Sem usuário → esconder catálogo e toolbar; mostrar um estado vazio com "Entrar com Google".
  - Com usuário → criar o `firestoreStore`, assinar e renderizar.
- No cabeçalho, perto do seletor de máquina: e-mail do usuário + botão "Sair" (cancela o `onSnapshot`, chama `signOut`, limpa `items`).
- Erros de gravação continuam aparecendo como hoje (botão "Não salvou. Tente de novo").

## Passos
1. **Separar arquivos**: `index.html` com estrutura completa (`<!doctype html>`, `<html lang="pt-BR">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>`), `styles.css` e `app.js`. Remover a meta `claude:viewport-fit-sides`. Conferir que o app abre igual ao protótipo (ainda com `localStore`) antes de mexer nos dados.
2. **Configurar o Firebase** (feito pelo usuário no console; o Claude orienta):
   - criar projeto no plano gratuito (Spark);
   - adicionar um app Web e copiar o `firebaseConfig` para `firebase-config.js`;
   - Authentication → ativar provedor Google → em "Domínios autorizados" adicionar `<usuario>.github.io` (`localhost` já vem autorizado);
   - Firestore → criar banco em modo produção e colar o conteúdo de `firestore.rules`.

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
3. **Trocar o armazenamento**: implementar `firestoreStore`, a preferência da máquina em `users/{uid}` e o fluxo de login; remover `dbStore`, `localStore`, `lsGet`/`lsSet`, `window.claude` e `#banner`.
4. **README.md e `.gitignore`**.
5. **Publicar**: renomear a branch `master` para `main`, criar o repositório no GitHub, push e ativar Pages (branch `main`, pasta `/`).
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

## Depois do MVP (não fazer agora)
- Cache offline do Firestore (`persistentLocalCache`) e PWA (`manifest.webmanifest`, ícone, service worker).
- Exportar/Importar JSON como backup.
- Compartilhar o catálogo com a família (catálogo com lista de membros em vez de dados por `uid`).
- Deploy das regras pelo Firebase CLI ou GitHub Actions.

## Fora de escopo
- Cápsulas do sistema **NEO**, que tem outro formato e outra máquina.
- Dados oficiais da Nestlé. Não fazer scraping do site da marca.
- Usar logotipo ou identidade visual da Nescafé Dolce Gusto. O app é pessoal e não deve imitar a marca.
