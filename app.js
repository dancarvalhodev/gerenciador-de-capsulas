// ============================================================================
// app.js: guarda o estado do app (o que está na tela agora) e reage aos cliques.
//   - Firebase (login e dados)  -> firebase.js
//   - HTML de cada pedaço       -> html.js
//   - Valores fixos e lista     -> dados.js
// ============================================================================
import {
  observarLogin,
  entrarComGoogle,
  sairDaConta,
  observarPreferencias,
  salvarPreferencias,
  acessarCapsulasDoUsuario,
  somarNoArmario,
} from "./firebase.js";
import { LISTA_PRONTA, LIMITE_ACABANDO } from "./dados.js";
import {
  quantidadeEmEstoque,
  avisoHTML,
  CATALOGO_VAZIO_HTML,
  DICAS_POR_MAQUINA,
  resumoDoEstoqueHTML,
  cartaoDoSaborHTML,
  passoNoEditorHTML,
  linhaDaListaProntaHTML,
} from "./html.js";

// Atalho para achar um elemento da página pelo seletor CSS (ex.: "#list").
const elemento = (seletor) => document.querySelector(seletor);

// Num grupo de botões (filtros, quente/fria...), marca como "apertado" o botão
// para o qual `estaAtivo(botao)` der verdadeiro, e desmarca os outros.
const marcarBotaoAtivo = (seletorDoGrupo, estaAtivo) =>
  elemento(seletorDoGrupo)
    .querySelectorAll("button")
    .forEach((botao) => botao.setAttribute("aria-pressed", String(estaAtivo(botao))));

// Compara nomes de sabores sem diferenciar maiúsculas de minúsculas.
const temMesmoNome = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

/* ---------- estado ---------- */
let capsulas = null; // lista vinda do Firebase; null enquanto ainda está carregando
let filtroAtivo = "todas";
let textoDaBusca = "";
let tipoDeMaquina = "auto"; // "auto" (com seletor) ou "manual"
let capsulasDoUsuario = null; // as ações criar/atualizar/excluir da pessoa logada
let idDoUsuario = null; // identificação da conta Google logada (null = ninguém)
let pararDeObservar = () => {}; // desliga os "olheiros" do Firebase ao sair da conta

function aplicarTipoDeMaquina(tipo) {
  tipoDeMaquina = tipo === "manual" ? "manual" : "auto";
  elemento("#machine").value = tipoDeMaquina;
}

/* ---------- login ---------- */

// Roda quando a página abre e sempre que alguém entra ou sai da conta.
observarLogin((usuario) => {
  // Limpa tudo da conta anterior (se havia uma).
  pararDeObservar();
  pararDeObservar = () => {};
  capsulas = null;
  capsulasDoUsuario = null;
  idDoUsuario = usuario?.uid ?? null;
  aplicarTipoDeMaquina("auto");

  // Logado: mostra o catálogo. Deslogado: mostra o cartão "Entrar com Google".
  elemento("#login").hidden = !!usuario;
  elemento("#app").hidden = !usuario;
  elemento("#conta").hidden = !usuario;
  elemento("#userEmail").textContent = usuario?.email ?? "";
  if (!usuario) return;

  // A partir daqui a pessoa está logada: começa a observar os dados dela.
  capsulasDoUsuario = acessarCapsulasDoUsuario(idDoUsuario);

  // Toda vez que as cápsulas mudarem (aqui ou em outro aparelho), redesenha a tela.
  const pararDeObservarCapsulas = capsulasDoUsuario.observar(
    (listaAtualizada) => {
      capsulas = listaAtualizada;
      desenharTela();
    },
    (erro) => {
      console.warn(erro);
      elemento("#list").innerHTML = avisoHTML(
        "Não deu para carregar seu catálogo. Recarregue a página.",
      );
    },
  );

  // Toda vez que o tipo de máquina mudar (aqui ou em outro aparelho), redesenha.
  const pararDeObservarPreferencias = observarPreferencias(
    idDoUsuario,
    (preferencias) => {
      aplicarTipoDeMaquina(preferencias.maquina);
      desenharTela();
    },
    console.warn,
  );

  pararDeObservar = () => {
    pararDeObservarCapsulas();
    pararDeObservarPreferencias();
  };
  desenharTela();
});

elemento("#btnLogin").addEventListener("click", async () => {
  const mensagemDeErro = elemento("#loginErro");
  mensagemDeErro.hidden = true;
  try {
    await entrarComGoogle();
  } catch (erro) {
    // Fechar a janelinha do Google sem escolher conta não é erro: só ignora.
    const fechouAJanela = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
    if (fechouAJanela.includes(erro?.code)) return;
    console.warn(erro);
    mensagemDeErro.textContent = "Não deu para entrar. Tente de novo.";
    mensagemDeErro.hidden = false;
  }
});
elemento("#btnSair").addEventListener("click", () => sairDaConta());

/* ---------- catálogo ---------- */

function combinaComFiltroEBusca(capsula) {
  const busca = textoDaBusca.trim().toLowerCase();
  if (busca && !String(capsula.nome).toLowerCase().includes(busca)) return false;
  if (filtroAtivo === "todas") return true;
  if (filtroAtivo === "frio") return capsula.temp === "frio";
  if (filtroAtivo === "acabando") return quantidadeEmEstoque(capsula) <= LIMITE_ACABANDO;
  return capsula.categoria === filtroAtivo; // filtros por categoria: cafe, leite, choco, cha
}

// Ordem da lista: esgotados no fim; o resto em ordem alfabética.
const ordenarEsgotadosNoFim = (a, b) =>
  (quantidadeEmEstoque(a) === 0) - (quantidadeEmEstoque(b) === 0) ||
  String(a.nome).localeCompare(String(b.nome), "pt-BR");

// Redesenha a dica, o resumo e os cartões a partir do estado atual.
function desenharTela() {
  elemento("#tip").innerHTML = DICAS_POR_MAQUINA[tipoDeMaquina];
  marcarBotaoAtivo("#filters", (botao) => botao.dataset.f === filtroAtivo);

  if (capsulas === null) {
    elemento("#summary").innerHTML = "";
    elemento("#list").innerHTML = avisoHTML("Carregando seu catálogo…");
    return;
  }
  elemento("#summary").innerHTML = resumoDoEstoqueHTML(capsulas);
  if (!capsulas.length) {
    elemento("#list").innerHTML = CATALOGO_VAZIO_HTML;
    return;
  }
  const capsulasVisiveis = capsulas.filter(combinaComFiltroEBusca).sort(ordenarEsgotadosNoFim);
  elemento("#list").innerHTML = capsulasVisiveis.length
    ? `<div class="grid">${capsulasVisiveis.map((c) => cartaoDoSaborHTML(c, tipoDeMaquina)).join("")}</div>`
    : avisoHTML("Nenhum sabor neste filtro.");
}

elemento("#filters").addEventListener("click", (evento) => {
  const botao = evento.target.closest(".chip");
  if (!botao) return;
  filtroAtivo = botao.dataset.f;
  desenharTela();
});
elemento("#q").addEventListener("input", (evento) => {
  textoDaBusca = evento.target.value;
  desenharTela();
});
elemento("#machine").addEventListener("change", (evento) => {
  aplicarTipoDeMaquina(evento.target.value);
  desenharTela();
  // Grava na gaveta da pessoa para os outros aparelhos também mudarem.
  salvarPreferencias(idDoUsuario, { maquina: tipoDeMaquina }).catch(console.warn);
});

// Um único "ouvinte" para todos os botões dos cartões: descobre qual botão foi
// clicado pelo `data-act` e qual sabor pelo `data-id` do cartão.
elemento("#list").addEventListener("click", async (evento) => {
  if (evento.target.closest("[data-open=pick]")) return abrirListaPronta();
  const botao = evento.target.closest("[data-act]");
  if (!botao) return;
  const idDoCartao = botao.closest(".card").dataset.id;
  const capsula = capsulas.find((c) => c.id === idDoCartao);
  if (!capsula) return;
  if (botao.dataset.act === "editar") return abrirEditor(capsula);

  // "mais" soma 1 bebida; "menos" e "Fazer uma" tiram 1.
  const variacao = botao.dataset.act === "mais" ? 1 : -1;
  if (quantidadeEmEstoque(capsula) + variacao < 0) return;
  botao.disabled = true; // evita clique duplo enquanto grava
  try {
    await capsulasDoUsuario.atualizar(capsula.id, { estoque: somarNoArmario(variacao) });
  } catch (erro) {
    console.warn(erro);
    botao.disabled = false;
  }
  // Se deu certo, não precisa redesenhar aqui: o "olheiro" do Firebase avisa e redesenha.
});

/* ---------- editor (Nova cápsula / Editar) ---------- */
const dialogoEditor = elemento("#dlgEdit");
const CAPSULA_PADRAO = { rotulo: "Café", barras: 2 };
let capsulaEmEdicao = null; // sabor sendo editado; null = criando um novo
let rascunho = null; // { temp, passos }: cópia editável enquanto o diálogo está aberto
let aguardandoConfirmarExclusao = false;

function abrirEditor(capsula) {
  capsulaEmEdicao = capsula;
  // Copia os passos para não mexer no original antes de salvar.
  const passosCopiados = (capsula?.passos ?? []).map((passo) => ({ ...passo }));
  rascunho = {
    temp: capsula?.temp || "quente",
    passos: passosCopiados.length ? passosCopiados : [{ ...CAPSULA_PADRAO }],
  };

  elemento("#editTitle").textContent = capsula ? "Editar cápsula" : "Nova cápsula";
  elemento("#fNome").value = capsula?.nome || "";
  elemento("#fCat").value = capsula?.categoria || "cafe";
  elemento("#fEstoque").value = capsula ? quantidadeEmEstoque(capsula) : 0;
  elemento("#fNota").value = capsula?.nota || "";

  // "Excluir" só aparece ao editar, e volta ao estado inicial (sem confirmação pendente).
  const botaoExcluir = elemento("#btnDel");
  botaoExcluir.hidden = !capsula;
  aguardandoConfirmarExclusao = false;
  botaoExcluir.classList.remove("armed");
  botaoExcluir.textContent = "Excluir";

  desenharRascunho();
  dialogoEditor.showModal();
}

function desenharRascunho() {
  const { temp, passos } = rascunho;
  marcarBotaoAtivo("#fTemp", (botao) => botao.dataset.v === temp);
  marcarBotaoAtivo("#fQtd", (botao) => Number(botao.dataset.v) === passos.length);
  const areaDosPassos = elemento("#stepEdits");
  areaDosPassos.className = "steps " + (temp === "frio" ? "cold-c" : "hot-c");
  areaDosPassos.innerHTML = passos
    .map((passo, i) => passoNoEditorHTML(passo, i, passos.length > 1))
    .join("");
}

// Redesenhar o rascunho apaga o que estava digitado nos campos; por isso,
// antes de redesenhar, guarda os rótulos digitados no rascunho.
function guardarRotulosDigitados() {
  rascunho.passos.forEach((passo, i) => {
    const campo = elemento("#fRot" + i);
    if (campo) passo.rotulo = campo.value.trim() || passo.rotulo;
  });
}

elemento("#fTemp").addEventListener("click", (evento) => {
  const botao = evento.target.closest("button");
  if (!botao) return;
  guardarRotulosDigitados();
  rascunho.temp = botao.dataset.v;
  desenharRascunho();
});
elemento("#fQtd").addEventListener("click", (evento) => {
  const botao = evento.target.closest("button");
  if (!botao) return;
  guardarRotulosDigitados();
  const [primeira, segunda] = rascunho.passos;
  // De 1 para 2 cápsulas: entra o leite antes. De 2 para 1: fica a segunda (café/chocolate).
  if (botao.dataset.v === "2" && !segunda) {
    rascunho.passos = [
      { rotulo: "Leite", barras: 4 },
      { ...primeira, barras: Math.min(primeira.barras, 3) },
    ];
  }
  if (botao.dataset.v === "1" && segunda) rascunho.passos = [segunda];
  desenharRascunho();
});
elemento("#stepEdits").addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-b]");
  if (!botao) return;
  guardarRotulosDigitados();
  const indiceDoPasso = botao.closest(".step-edit").dataset.i;
  rascunho.passos[indiceDoPasso].barras = Number(botao.dataset.b);
  desenharRascunho();
});

elemento("#formEdit").addEventListener("submit", async (evento) => {
  evento.preventDefault(); // não deixa o navegador recarregar a página
  guardarRotulosDigitados();
  const nome = elemento("#fNome").value.trim();
  if (!nome) return elemento("#fNome").focus();
  const estoqueDigitado = parseInt(elemento("#fEstoque").value, 10) || 0;
  const dadosDoSabor = {
    nome,
    categoria: elemento("#fCat").value,
    temp: rascunho.temp,
    passos: rascunho.passos.map((p) => ({ rotulo: p.rotulo || "Cápsula", barras: p.barras })),
    estoque: Math.max(0, Math.min(999, estoqueDigitado)), // entre 0 e 999
    nota: elemento("#fNota").value.trim(),
  };
  const botaoSalvar = elemento("#btnSave");
  botaoSalvar.disabled = true;
  try {
    if (capsulaEmEdicao) await capsulasDoUsuario.atualizar(capsulaEmEdicao.id, dadosDoSabor);
    else await capsulasDoUsuario.criar(dadosDoSabor);
    dialogoEditor.close();
  } catch (erro) {
    console.warn(erro);
    botaoSalvar.textContent = "Não salvou. Tente de novo";
    setTimeout(() => (botaoSalvar.textContent = "Salvar"), 2500);
  } finally {
    botaoSalvar.disabled = false;
  }
});

// Excluir pede um segundo toque: o primeiro só "arma" o botão.
elemento("#btnDel").addEventListener("click", async (evento) => {
  const botaoExcluir = evento.currentTarget;
  if (!aguardandoConfirmarExclusao) {
    aguardandoConfirmarExclusao = true;
    botaoExcluir.classList.add("armed");
    botaoExcluir.textContent = "Toque de novo para excluir";
    return;
  }
  botaoExcluir.disabled = true;
  try {
    await capsulasDoUsuario.excluir(capsulaEmEdicao.id);
    dialogoEditor.close();
  } catch (erro) {
    console.warn(erro);
  } finally {
    botaoExcluir.disabled = false;
  }
});

/* ---------- "Adicionar da lista" ---------- */
const dialogoListaPronta = elemento("#dlgPick");
let quantidadesEscolhidas = {}; // posição na LISTA_PRONTA -> quantas bebidas chegaram

function abrirListaPronta() {
  quantidadesEscolhidas = {};
  desenharListaPronta();
  dialogoListaPronta.showModal();
}

function desenharListaPronta() {
  const jaEstaNoCatalogo = (modelo) =>
    (capsulas ?? []).some((c) => temMesmoNome(c.nome, modelo.nome));
  elemento("#picklist").innerHTML = LISTA_PRONTA.map((modelo, i) =>
    linhaDaListaProntaHTML(modelo, i, quantidadesEscolhidas[i] || 0, jaEstaNoCatalogo(modelo)),
  ).join("");

  const saboresEscolhidos = Object.values(quantidadesEscolhidas).filter(Boolean).length;
  elemento("#pickCount").textContent = saboresEscolhidos
    ? `${saboresEscolhidos} ${saboresEscolhidos === 1 ? "sabor selecionado" : "sabores selecionados"}`
    : "Nada selecionado";
  elemento("#pickAdd").disabled = !saboresEscolhidos;
}

elemento("#picklist").addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-d]"); // data-d = +1 ou -1
  if (!botao) return;
  const indiceDoModelo = botao.closest(".pickrow").dataset.i;
  const novaQuantidade = (quantidadesEscolhidas[indiceDoModelo] || 0) + Number(botao.dataset.d);
  quantidadesEscolhidas[indiceDoModelo] = Math.max(0, novaQuantidade);
  desenharListaPronta();
});

// Sabor que já está no catálogo só ganha estoque; os outros viram fichas novas.
elemento("#pickAdd").addEventListener("click", async (evento) => {
  const botaoAdicionar = evento.currentTarget;
  botaoAdicionar.disabled = true;
  botaoAdicionar.textContent = "Adicionando…";
  try {
    for (const [indice, quantidade] of Object.entries(quantidadesEscolhidas)) {
      if (!quantidade) continue;
      const modelo = LISTA_PRONTA[indice];
      const saborExistente = (capsulas ?? []).find((c) => temMesmoNome(c.nome, modelo.nome));
      if (saborExistente) {
        await capsulasDoUsuario.atualizar(saborExistente.id, {
          estoque: somarNoArmario(quantidade),
        });
      } else {
        const passosCopiados = modelo.passos.map((passo) => ({ ...passo }));
        await capsulasDoUsuario.criar({
          ...modelo,
          passos: passosCopiados,
          estoque: quantidade,
          nota: "",
        });
      }
    }
    dialogoListaPronta.close();
  } catch (erro) {
    console.warn(erro);
  } finally {
    botaoAdicionar.textContent = "Adicionar ao catálogo";
  }
});

/* ---------- geral ---------- */

// Todo botão com `data-close` fecha o diálogo em que está.
document
  .querySelectorAll("[data-close]")
  .forEach((botao) => botao.addEventListener("click", () => botao.closest("dialog").close()));
elemento("#openNew").addEventListener("click", () => abrirEditor(null));
elemento("#openPick").addEventListener("click", abrirListaPronta);
