# O Firebase deste app

O Firebase é um serviço do Google que guarda os dados do app na internet. É por ele que o catálogo aparece igual no celular e no computador. Este documento explica cada peça com uma analogia simples.

## 1. A analogia

Pense no Firebase como uma **casa** na internet onde os dados moram.

| No Firebase | Na analogia | Onde aparece no código |
| --- | --- | --- |
| Projeto `minhas-capsulas` | A **casa** | `js/firebase-config.js` |
| Configuração do projeto | O **endereço** da casa | `firebaseConfig` |
| Authentication (login) | O **porteiro**, que confere quem entra | `porteiro` em `js/firebase.js` |
| Regras de segurança | A **lista do porteiro**: quem pode abrir o quê | `firebase/firestore.rules` |
| Firestore (banco de dados) | O **armário** | `armario` em `js/firebase.js` |
| Documento `users/{id}` | A **gaveta** de uma pessoa | `observarPreferencias`, `salvarPreferencias` |
| Coleção `users/{id}/capsulas` | A **pasta de fichas** dentro da gaveta | `acessarCapsulasDoUsuario` |
| Documento de uma cápsula | Uma **ficha**, uma por sabor | `criar`, `atualizar`, `excluir` |

`{id}` é o número que o Google dá para cada conta. Cada pessoa tem a sua gaveta.

## 2. O endereço (`js/firebase-config.js`)

```js
export const firebaseConfig = {
  apiKey: "AIza...",
  projectId: "minhas-capsulas",
  // ...
};
```

- **O que é:** diz ao app em qual casa bater.
- **Pode ser público?** Sim. Um endereço não abre a porta: quem decide se alguém entra é o porteiro, seguindo as regras.
- **O GitHub avisou que a chave "vazou".** É um alarme falso para este tipo de chave, e o alerta foi fechado.
- **Proteção extra:** no Google Cloud, a chave só funciona em três sites: `localhost:8000` (testes no seu computador), `dancarvalhodev.github.io` (o site publicado) e `minhas-capsulas.firebaseapp.com` (a janelinha de login do Google). Para testar em outra porta ou em outro site, é preciso incluí-lo lá (seção 8).

## 3. O porteiro (login com Google)

- **Entrar:** o botão "Entrar com Google" abre uma janelinha para escolher a conta. O porteiro confere a conta e deixa a pessoa entrar.
- **Domínios autorizados:** o porteiro só atende pedidos vindos de sites da lista dele. `localhost` já vem na lista; `dancarvalhodev.github.io` foi adicionado.
- **Ao entrar:** o app recebe o id da conta, abre a gaveta da pessoa e começa a observar as fichas (seção 7).
- **Ao sair:** o app para de observar e limpa a tela. Os dados continuam guardados no armário.

## 4. As regras (`firebase/firestore.rules`)

```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
  match /capsulas/{id} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

Linha a linha:
- `match /users/{uid}`: vale para qualquer gaveta. `{uid}` é o id do dono daquela gaveta.
- `allow read, write`: pode ler e gravar…
- `if request.auth != null`: …se a pessoa passou pelo porteiro (está logada)…
- `&& request.auth.uid == uid`: …e se a gaveta é dela.
- `match /capsulas/{id}`: a mesma regra para as fichas dentro da gaveta.

| Situação | O porteiro deixa? |
| --- | --- |
| Você, logado, abre a sua gaveta | Sim |
| Você, logado, tenta abrir a gaveta de outra pessoa | Não |
| Alguém sem login tenta abrir qualquer gaveta | Não |
| Alguém copia o endereço (`firebase-config.js`) e tenta ler os dados | Não: o endereço não é login |

O arquivo do repositório é uma **cópia**. A lista que vale é a publicada no console do Firebase. Se mudar o arquivo, cole a versão nova no console (seção 8).

## 5. O armário: gaveta e fichas

**Gaveta** `users/{id}`: guarda as preferências da pessoa.

```json
{ "maquina": "auto" }
```

`maquina` é `"auto"` (máquina com seletor) ou `"manual"`. Se a gaveta estiver vazia, o app usa `"auto"`.

**Fichas** `users/{id}/capsulas/{idDaFicha}`: uma por sabor.

```json
{ "nome": "Cappuccino", "categoria": "leite", "temp": "quente",
  "passos": [{ "rotulo": "Leite", "barras": 4 }, { "rotulo": "Café", "barras": 2 }],
  "estoque": 6, "nota": "" }
```

| Campo | O que guarda |
| --- | --- |
| `nome` | Nome do sabor |
| `categoria` | `cafe`, `leite`, `choco` ou `cha` |
| `temp` | `quente` ou `frio` |
| `passos` | Cápsulas na ordem de uso, cada uma com as barras de água (1 a 7) |
| `estoque` | Quantas bebidas ainda dá para fazer |
| `nota` | Observação livre |

O id de cada ficha é criado pelo próprio Firebase.

## 6. `js/firebase.js` função por função

Este é o único arquivo que conversa com o Firebase. O resto do app só usa as funções abaixo.

**Conectar**
```js
const conexaoFirebase = initializeApp(firebaseConfig);
const porteiro = getAuth(conexaoFirebase);
const armario = getFirestore(conexaoFirebase);
```
Vai até a casa pelo endereço e pega o porteiro e o armário dela.

**Login**
```js
observarLogin(aoMudar)  // avisa agora e sempre que alguém entra ou sai
entrarComGoogle()       // abre a janelinha do Google
sairDaConta()           // desconecta
```
Conversam com o porteiro. `observarLogin` é como pedir ao porteiro: "me avise quando alguém chegar ou sair".

**Preferências (a gaveta)**
```js
observarPreferencias(idDoUsuario, aoMudar, aoFalhar)
salvarPreferencias(idDoUsuario, { maquina: "manual" })
```
- `observarPreferencias` fica de olho na gaveta e avisa a cada mudança, inclusive mudanças feitas em outro aparelho.
- `salvarPreferencias` grava só o campo enviado e mantém o resto (`merge: true`).

**Cápsulas (as fichas)**
```js
const capsulas = acessarCapsulasDoUsuario(idDoUsuario);
capsulas.observar(aoMudar, aoFalhar)  // entrega a lista agora e a cada mudança
capsulas.criar(dados)                 // ficha nova
capsulas.atualizar(id, campos)        // muda só os campos enviados
capsulas.excluir(id)                  // joga a ficha fora
```
Devolve as quatro ações que o app faz com a pasta de fichas da pessoa.

**Estoque**
```js
capsulas.atualizar(id, { estoque: somarNoArmario(-1) });
```
`somarNoArmario` é o `increment` do Firebase, com um nome mais claro (seção 7).

## 7. Sincronização

**Observar.** Quando o app "observa" a pasta de fichas, é como deixar alguém de olho no armário: qualquer ficha que mudar, de qualquer aparelho, gera um aviso. O app recebe a lista nova e redesenha a tela. Por isso, depois de gravar, o app não redesenha por conta própria: ele espera o aviso.

```
celular grava → armário muda → o PC recebe o aviso → o PC redesenha a tela
```

**Por que "some 1" em vez de "agora é 5".** Imagine o estoque em 6 e duas pessoas fazendo uma bebida ao mesmo tempo, uma no celular e outra no PC.

| Jeito de gravar | Celular | PC | Resultado no armário |
| --- | --- | --- | --- |
| "Agora é 5" | grava 5 | grava 5 | 5 (uma bebida sumiu da conta) |
| "Tire 1" (`somarNoArmario(-1)`) | tira 1 | tira 1 | 4 (correto) |

Com "tire 1", quem faz a conta é o armário, e nenhuma mudança se perde.

## 8. Onde mexer, se precisar

| O quê | Onde |
| --- | --- |
| Ver as fichas gravadas | Console do Firebase → Firestore Database → aba Dados |
| Publicar as regras | Console do Firebase → Firestore Database → aba Regras: colar `firebase/firestore.rules` e publicar |
| Ativar ou desativar o login Google | Console do Firebase → Authentication → Método de login |
| Domínios autorizados do porteiro | Console do Firebase → Authentication → Configurações → Domínios autorizados |
| Sites em que a chave funciona | Google Cloud Console → APIs e serviços → Credenciais → chave do navegador → Restrições de aplicativos |

- Console do Firebase: https://console.firebase.google.com (projeto `minhas-capsulas`).
- Google Cloud Console: https://console.cloud.google.com (mesmo projeto).
- O armário fica no servidor `southamerica-east1` (São Paulo), no plano gratuito (Spark), que dá com folga para um app pessoal.
