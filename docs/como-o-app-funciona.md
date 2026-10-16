# Como o app funciona

O caminho de um clique até o dado salvo, arquivo por arquivo. Os termos do Firebase (porteiro, armário, gaveta, ficha) estão explicados em [firebase.md](firebase.md).

## 1. Mapa dos arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | A estrutura da página: cabeçalho, cartão de login, catálogo e as janelas de editar e de adicionar. |
| `css/styles.css` | Toda a aparência: cores, tema escuro, tamanhos, layout do celular. |
| `js/app.js` | O "cérebro": guarda o estado da tela e reage aos cliques. |
| `js/firebase.js` | O único arquivo que conversa com o Firebase (login e dados). |
| `js/firebase-config.js` | O endereço público do projeto no Firebase. |
| `js/html.js` | Funções que montam o HTML de cada pedaço da tela (cartão, resumo, lista). Não mexem na página nem no Firebase. |
| `js/dados.js` | Valores fixos: nomes das categorias, ml por barra, limite "Acabando" e a lista pronta de sabores. |
| `firebase/firestore.rules` | Cópia das regras de segurança publicadas no console. |

Quem chama quem:

```
index.html → js/app.js → js/firebase.js → Firebase
                       → js/html.js → js/dados.js
                       → js/dados.js
```

## 2. Ao abrir a página

1. O navegador carrega `index.html`, que puxa `css/styles.css` e `js/app.js`.
2. `app.js` chama `observarLogin`: pede ao porteiro para avisar quem está logado.
3. **Ninguém logado:** aparece o cartão "Entrar com Google" (`#login`).
4. **Alguém logado:**
   - aparecem o catálogo (`#app`), o e-mail e o botão "Sair" (`#conta`);
   - `acessarCapsulasDoUsuario` abre a pasta de fichas da pessoa;
   - o app começa a **observar** as fichas e a gaveta de preferências;
   - enquanto a lista não chega, a tela mostra "Carregando seu catálogo…";
   - quando chega, `desenharTela()` monta o resumo e os cartões.

O estado do app são algumas variáveis no topo de `app.js`: `capsulas` (a lista), `filtroAtivo`, `textoDaBusca` e `tipoDeMaquina`. Toda mudança nelas termina em `desenharTela()`, que monta a tela inteira de novo a partir delas.

## 3. Exemplo completo: clicar em "Fazer uma"

**1. O botão (`js/html.js`)**
```js
<article class="card" data-id="${capsula.id}">
  <button data-act="fazer">Fazer uma</button>
```
O cartão guarda o id da ficha (`data-id`), e o botão diz qual ação faz (`data-act`).

**2. O clique (`js/app.js`)**
```js
elemento("#list").addEventListener("click", async (evento) => {
  const botao = evento.target.closest("[data-act]");
  const idDoCartao = botao.closest(".card").dataset.id;
```
Um único "ouvinte" atende todos os botões dos cartões. Ele descobre qual botão foi clicado e de qual sabor. É como uma recepção que atende todas as portas do prédio, em vez de um porteiro em cada porta.

**3. O pedido ao armário (`js/app.js` → `js/firebase.js`)**
```js
const variacao = botao.dataset.act === "mais" ? 1 : -1;
await capsulasDoUsuario.atualizar(capsula.id, { estoque: somarNoArmario(variacao) });
```
"Fazer uma" e "−" tiram 1; "+" soma 1. O app pede ao armário: "na ficha deste sabor, tire 1 do estoque".

**4. O armário grava** e avisa todos os aparelhos que estão observando aquela pasta, inclusive este.

**5. A tela é redesenhada (`js/app.js`)**
```js
capsulasDoUsuario.observar((listaAtualizada) => {
  capsulas = listaAtualizada;
  desenharTela();
});
```
Chega a lista nova, e `desenharTela()` remonta os cartões com o estoque atualizado. Se o estoque chegar a 2, aparece o selo "Acabando"; se chegar a 0, "Esgotado", e o cartão vai para o fim da lista.

## 4. Onde mexer para tarefas comuns

| Tarefa | Onde |
| --- | --- |
| Adicionar um sabor à lista pronta | `js/dados.js`, em `LISTA_PRONTA`: copie uma linha parecida e troque os valores. |
| Mudar quando aparece "Acabando" | `js/dados.js`, `LIMITE_ACABANDO` (hoje 2). |
| Mudar os ml por barra | `js/dados.js`, `ML_POR_BARRA` (hoje 30). |
| Mudar os nomes das categorias | `js/dados.js`, `NOMES_DAS_CATEGORIAS`. |
| Mudar textos fixos da página (títulos, rodapé, botões) | `index.html`. |
| Mudar textos dos cartões, das dicas da máquina ou do catálogo vazio | `js/html.js` (`cartaoDoSaborHTML`, `DICAS_POR_MAQUINA`, `CATALOGO_VAZIO_HTML`). |
| Mudar cores ou tamanhos | `css/styles.css`: as cores ficam no topo, em `:root`, e o tema escuro logo abaixo. |

Ao mudar `js/html.js`, todo texto digitado pelo usuário precisa passar por `escaparHTML()`. Sem isso, um nome como `<b>x</b>` viraria HTML de verdade na tela.
