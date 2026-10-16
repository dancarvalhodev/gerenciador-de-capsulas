// Funções que só MONTAM o HTML (texto) de cada pedaço da tela a partir dos dados.
// Não mexem na página nem no Firebase: quem coloca o HTML na tela é o app.js.
import { NOMES_DAS_CATEGORIAS, ML_POR_BARRA, LIMITE_ACABANDO } from "./dados.js";

// A escala de água impressa na tampa vai de 1 a 7 barras.
const NIVEIS_DE_AGUA = [1, 2, 3, 4, 5, 6, 7];

// Troca os caracteres especiais do HTML (< > & " ') por versões "inofensivas".
// Use em TODO texto digitado pelo usuário: sem isso, um nome como "<b>x</b>"
// viraria HTML de verdade na tela em vez de aparecer como texto.
export const escaparHTML = (texto) =>
  String(texto ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Estoque como número; campo vazio ou inválido conta como 0.
export const quantidadeEmEstoque = (capsula) => Number(capsula.estoque) || 0;

// comPlural(1, "barra", "barras") -> "1 barra"; comPlural(3, ...) -> "3 barras".
const comPlural = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

// Caixa com uma mensagem simples (carregando, erro, filtro sem resultado).
export const avisoHTML = (mensagem) => `<div class="empty"><p>${mensagem}</p></div>`;

export const CATALOGO_VAZIO_HTML = `
  <div class="empty">
    <h3>Seu catálogo está vazio</h3>
    <p>
      Comece pela lista pronta: marque os sabores que vieram na caixa e quantos de cada.
      Depois confira as barras na tampa e ajuste o que for diferente.
    </p>
    <button class="btn primary" data-open="pick">Adicionar da lista</button>
  </div>`;

// Dica exibida no topo, conforme o tipo de máquina escolhido.
export const DICAS_POR_MAQUINA = {
  manual: `
    <p>
      <strong>Máquina manual:</strong> ela não para sozinha. Acione a alavanca e solte quando o
      copo chegar aos ml indicados. Vale marcar no seu copo a altura de 60, 120 e 180 ml. Para
      bebidas geladas, use a posição fria (ícone azul).
    </p>`,
  auto: `
    <p>
      <strong>Máquina com seletor:</strong> ajuste o número de barras e escolha quente ou frio;
      ela para sozinha. Nas bebidas de 2 cápsulas, faça uma de cada vez, na ordem do cartão.
    </p>`,
};

// Os três números do topo: total de bebidas, quantos sabores e quantos acabando.
export function resumoDoEstoqueHTML(capsulas) {
  if (!capsulas.length) return "";
  const totalDeBebidas = capsulas.reduce((soma, c) => soma + quantidadeEmEstoque(c), 0);
  const saboresAcabando = capsulas.filter((c) => quantidadeEmEstoque(c) <= LIMITE_ACABANDO).length;
  return `
    <div><b>${totalDeBebidas}</b><span>bebidas no estoque</span></div>
    <div><b>${capsulas.length}</b><span>sabores</span></div>
    <div><b>${saboresAcabando}</b><span>acabando ou esgotados</span></div>`;
}

/* ---------- cartão de um sabor ---------- */

// As 7 "luzinhas" do painel da máquina, com as primeiras `barras` acesas.
const barrasDeAguaHTML = (barras) => {
  const luzes = NIVEIS_DE_AGUA.map((nivel) => `<i class="${nivel <= barras ? "on" : ""}"></i>`);
  return `<span class="leds" aria-hidden="true">${luzes.join("")}</span>`;
};

function seloDeEstoqueHTML(estoque) {
  if (estoque === 0) return `<span class="pill zero">Esgotado</span>`;
  if (estoque <= LIMITE_ACABANDO) return `<span class="pill low">Acabando</span>`;
  return "";
}

// Uma linha do cartão: qual cápsula colocar e quanta água usar.
function passoDePreparoHTML(passo, indice, totalDePassos, tipoDeMaquina) {
  const ml = `≈${passo.barras * ML_POR_BARRA} ml`;
  const barras = comPlural(passo.barras, "barra", "barras");
  // Máquina manual: o mais importante é até onde encher (ml).
  // Máquina com seletor: o mais importante é quantas barras marcar.
  const [destaque, complemento] =
    tipoDeMaquina === "manual" ? [`pare em ${ml}`, barras] : [barras, ml];
  const temDuasCapsulas = totalDePassos > 1;
  const ordem = `${indice + 1}ª`;
  return `
    <div class="step">
      <span class="ord">${temDuasCapsulas ? ordem : "1"}</span>
      <span class="what">${temDuasCapsulas ? `${ordem} cápsula: ` : ""}${escaparHTML(passo.rotulo)}</span>
      <span class="how">${barrasDeAguaHTML(passo.barras)}<em>${destaque}</em><span>${complemento}</span></span>
    </div>`;
}

export function cartaoDoSaborHTML(capsula, tipoDeMaquina) {
  const estoque = quantidadeEmEstoque(capsula);
  const esgotado = estoque === 0;
  const gelada = capsula.temp === "frio";
  const passos = capsula.passos ?? [];
  const nome = escaparHTML(capsula.nome);
  const categoria = escaparHTML(NOMES_DAS_CATEGORIAS[capsula.categoria] || "Outro");
  // `data-id` guarda o id da ficha no Firebase, para o clique saber qual sabor é.
  // `data-act` diz ao app.js qual ação o botão faz (menos, mais, editar, fazer).
  return `
    <article class="card ${gelada ? "cold-c" : "hot-c"} ${esgotado ? "out" : ""}" data-id="${escaparHTML(capsula.id)}">
      <div class="card-head">
        <div>
          <h3>${nome}</h3>
          <div class="cat">${categoria}${passos.length > 1 ? " · 2 cápsulas" : ""}</div>
        </div>
        <div class="pills">
          <span class="pill ${gelada ? "cold" : "hot"}">${gelada ? "Água fria" : "Água quente"}</span>
          ${seloDeEstoqueHTML(estoque)}
        </div>
      </div>
      <div class="steps">
        ${passos.map((passo, i) => passoDePreparoHTML(passo, i, passos.length, tipoDeMaquina)).join("")}
      </div>
      ${capsula.nota ? `<p class="note">${escaparHTML(capsula.nota)}</p>` : ""}
      <div class="card-foot">
        <div class="stock">
          <button data-act="menos" aria-label="Diminuir estoque de ${nome}" ${esgotado ? "disabled" : ""}>−</button>
          <output><b>${estoque}</b> ${estoque === 1 ? "bebida" : "bebidas"}</output>
          <button data-act="mais" aria-label="Aumentar estoque de ${nome}">+</button>
        </div>
        <div class="actions">
          <button class="btn" data-act="editar">Editar</button>
          <button class="btn primary" data-act="fazer" ${esgotado ? "disabled" : ""}>Fazer uma</button>
        </div>
      </div>
    </article>`;
}

/* ---------- editor: o bloco de uma cápsula dentro do formulário ---------- */

export function passoNoEditorHTML(passo, indice, temDuasCapsulas) {
  // Botões de 1 a 7 para escolher as barras; os até o valor atual ficam acesos.
  const botoesDeBarras = NIVEIS_DE_AGUA.map(
    (nivel) =>
      `<button type="button" data-b="${nivel}" class="${nivel <= passo.barras ? "on" : ""}" aria-pressed="${nivel === passo.barras}">${nivel}</button>`,
  ).join("");
  const titulo = temDuasCapsulas ? `${indice + 1}ª cápsula` : "Cápsula";
  const exemplo = temDuasCapsulas && indice === 0 ? "Leite" : "Café";
  return `
    <div class="step-edit" data-i="${indice}">
      <label class="field" for="fRot${indice}">
        <span class="label">${titulo}</span>
        <input type="text" id="fRot${indice}" value="${escaparHTML(passo.rotulo)}" maxlength="30" placeholder="${exemplo}" />
      </label>
      <div class="field">
        <span class="label">Barras de água · ≈${passo.barras * ML_POR_BARRA} ml</span>
        <div class="ledpick" role="group" aria-label="Barras de água">${botoesDeBarras}</div>
      </div>
    </div>`;
}

/* ---------- "Adicionar da lista": uma linha por sabor ---------- */

export function linhaDaListaProntaHTML(modelo, indice, quantidade, jaEstaNoCatalogo) {
  // Ex.: "Leite 4 → Café 2 · fria"
  const resumoDoPreparo =
    modelo.passos.map((p) => `${p.rotulo} ${p.barras}`).join(" → ") +
    (modelo.temp === "frio" ? " · fria" : "");
  const nome = escaparHTML(modelo.nome);
  return `
    <div class="pickrow ${quantidade ? "sel" : ""}" data-i="${indice}">
      <div>
        <b>${nome}</b>
        ${jaEstaNoCatalogo ? `<span class="pill low">já no catálogo</span>` : ""}
        <small>${escaparHTML(resumoDoPreparo)}</small>
      </div>
      <div class="stock">
        <button data-d="-1" aria-label="Menos ${nome}" ${quantidade ? "" : "disabled"}>−</button>
        <output><b>${quantidade}</b></output>
        <button data-d="1" aria-label="Mais ${nome}">+</button>
      </div>
    </div>`;
}
