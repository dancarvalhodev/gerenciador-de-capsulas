const CATS = {
  cafe: "Café puro",
  leite: "Café com leite",
  choco: "Chocolate",
  cha: "Chá e outros",
};
const ML_POR_BARRA = 30;
const BAIXO = 2;

// Lista pronta: valores sugeridos, conferir na tampa.
// prettier-ignore
const MODELOS = [
  { nome: "Ristretto Ardenza", categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 1 }] },
  { nome: "Espresso Intenso",  categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 2 }] },
  { nome: "Espresso",          categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 2 }] },
  { nome: "Espresso Barista",  categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 2 }] },
  { nome: "Lungo",             categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 4 }] },
  { nome: "Americano",         categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 6 }] },
  { nome: "Grande Intenso",    categoria: "cafe",  temp: "quente", passos: [{ rotulo: "Café", barras: 6 }] },
  { nome: "Cortado",           categoria: "leite", temp: "quente", passos: [{ rotulo: "Cortado", barras: 3 }] },
  { nome: "Café com Leite",    categoria: "leite", temp: "quente", passos: [{ rotulo: "Café com leite", barras: 6 }] },
  { nome: "Cappuccino",        categoria: "leite", temp: "quente", passos: [{ rotulo: "Leite", barras: 4 }, { rotulo: "Café", barras: 2 }] },
  { nome: "Latte Macchiato",   categoria: "leite", temp: "quente", passos: [{ rotulo: "Leite", barras: 5 }, { rotulo: "Café", barras: 2 }] },
  { nome: "Cappuccino Ice",    categoria: "leite", temp: "frio",   passos: [{ rotulo: "Leite", barras: 4 }, { rotulo: "Café", barras: 2 }] },
  { nome: "Chococino",         categoria: "choco", temp: "quente", passos: [{ rotulo: "Leite", barras: 4 }, { rotulo: "Chocolate", barras: 3 }] },
  { nome: "Nescau",            categoria: "choco", temp: "quente", passos: [{ rotulo: "Nescau", barras: 6 }] },
  { nome: "Chá",               categoria: "cha",   temp: "quente", passos: [{ rotulo: "Chá", barras: 6 }] },
];

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const lsGet = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v == null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

let items = null; // null = carregando
let filtro = lsGet("capsulas.filtro", "todas");
let busca = "";
let maquina = lsGet("capsulas.maquina", "auto");
let store = null;

/* ---------- armazenamento ---------- */
function localStore() {
  const K = "capsulas.itens";
  let cb = () => {};
  const read = () => lsGet(K, []);
  const write = (arr) => {
    lsSet(K, arr);
    cb(arr);
  };
  return {
    subscribe(f) {
      cb = f;
      f(read());
    },
    async add(d) {
      write([
        ...read(),
        { ...d, id: "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) },
      ]);
    },
    async update(id, patch) {
      write(read().map((x) => (x.id === id ? { ...x, ...patch } : x)));
    },
    async remove(id) {
      write(read().filter((x) => x.id !== id));
    },
  };
}
function dbStore(db) {
  const col = db.collection("capsulas");
  return {
    subscribe(f) {
      col.onSnapshot(
        (s) => f(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (e) => {
          console.warn("db", e);
        },
      );
    },
    add(d) {
      return col.add(d);
    },
    update(id, patch) {
      return col.doc(id).update(patch);
    },
    remove(id) {
      return col.doc(id).delete();
    },
  };
}
async function iniciar() {
  let db = null;
  try {
    db = window.claude?.use ? await window.claude.use("db") : null;
  } catch {
    db = null;
  }
  if (db) store = dbStore(db);
  else {
    store = localStore();
    $("#banner").hidden = false;
  }
  store.subscribe((arr) => {
    items = arr;
    render();
  });
}

/* ---------- render ---------- */
const leds = (n, max = 7) =>
  `<span class="leds" aria-hidden="true">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span>`;

function stepHTML(p, i, total) {
  const ml = p.barras * ML_POR_BARRA;
  const how =
    maquina === "manual"
      ? `${leds(p.barras)}<em>pare em ≈${ml} ml</em><span>${p.barras} ${p.barras === 1 ? "barra" : "barras"}</span>`
      : `${leds(p.barras)}<em>${p.barras} ${p.barras === 1 ? "barra" : "barras"}</em><span>≈${ml} ml</span>`;
  const ord = total > 1 ? `${i + 1}ª` : "1";
  return `<div class="step"><span class="ord">${ord}</span><span class="what">${total > 1 ? i + 1 + "ª cápsula: " : ""}${esc(p.rotulo)}</span><span class="how">${how}</span></div>`;
}

function cardHTML(x) {
  const est = Number(x.estoque) || 0;
  const frio = x.temp === "frio";
  const status =
    est === 0
      ? `<span class="pill zero">Esgotado</span>`
      : est <= BAIXO
        ? `<span class="pill low">Acabando</span>`
        : "";
  const passos = Array.isArray(x.passos) ? x.passos : [];
  return `<article class="card ${frio ? "cold-c" : "hot-c"} ${est === 0 ? "out" : ""}" data-id="${esc(x.id)}">
    <div class="card-head">
      <div><h3>${esc(x.nome)}</h3><div class="cat">${esc(CATS[x.categoria] || "Outro")}${passos.length > 1 ? " · 2 cápsulas" : ""}</div></div>
      <div class="pills"><span class="pill ${frio ? "cold" : "hot"}">${frio ? "Água fria" : "Água quente"}</span>${status}</div>
    </div>
    <div class="steps">${passos.map((p, i) => stepHTML(p, i, passos.length)).join("")}</div>
    ${x.nota ? `<p class="note">${esc(x.nota)}</p>` : ""}
    <div class="card-foot">
      <div class="stock">
        <button data-act="menos" aria-label="Diminuir estoque de ${esc(x.nome)}" ${est === 0 ? "disabled" : ""}>−</button>
        <output><b>${est}</b> ${est === 1 ? "bebida" : "bebidas"}</output>
        <button data-act="mais" aria-label="Aumentar estoque de ${esc(x.nome)}">+</button>
      </div>
      <div class="actions">
        <button class="btn" data-act="editar">Editar</button>
        <button class="btn primary" data-act="fazer" ${est === 0 ? "disabled" : ""}>Fazer uma</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const tip =
    maquina === "manual"
      ? `<p><strong>Máquina manual:</strong> ela não para sozinha. Acione a alavanca e solte quando o copo chegar aos ml indicados. Vale marcar no seu copo a altura de 60, 120 e 180 ml. Para bebidas geladas, use a posição fria (ícone azul).</p>`
      : `<p><strong>Máquina com seletor:</strong> ajuste o número de barras e escolha quente ou frio; ela para sozinha. Nas bebidas de 2 cápsulas, faça uma de cada vez, na ordem do cartão.</p>`;
  $("#tip").innerHTML = tip;
  document
    .querySelectorAll("#filters .chip")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filtro)));

  const list = $("#list");
  if (items === null) {
    list.innerHTML = `<div class="empty"><p>Carregando seu catálogo…</p></div>`;
    $("#summary").innerHTML = "";
    return;
  }

  const total = items.reduce((s, x) => s + (Number(x.estoque) || 0), 0);
  const acabando = items.filter((x) => (Number(x.estoque) || 0) <= BAIXO).length;
  $("#summary").innerHTML = items.length
    ? `<div><b>${total}</b><span>bebidas no estoque</span></div><div><b>${items.length}</b><span>sabores</span></div><div><b>${acabando}</b><span>acabando ou esgotados</span></div>`
    : "";

  if (!items.length) {
    list.innerHTML = `<div class="empty"><h3>Seu catálogo está vazio</h3><p>Comece pela lista pronta: marque os sabores que vieram na caixa e quantos de cada. Depois confira as barras na tampa e ajuste o que for diferente.</p><button class="btn primary" data-open="pick">Adicionar da lista</button></div>`;
    return;
  }

  const q = busca.trim().toLowerCase();
  const vis = items
    .filter((x) => {
      const est = Number(x.estoque) || 0;
      if (filtro === "frio") return x.temp === "frio";
      if (filtro === "acabando") return est <= BAIXO;
      if (filtro !== "todas") return x.categoria === filtro;
      return true;
    })
    .filter((x) => !q || String(x.nome).toLowerCase().includes(q))
    .sort(
      (a, b) =>
        ((Number(a.estoque) || 0) === 0) - ((Number(b.estoque) || 0) === 0) ||
        String(a.nome).localeCompare(String(b.nome), "pt-BR"),
    );

  list.innerHTML = vis.length
    ? `<div class="grid">${vis.map(cardHTML).join("")}</div>`
    : `<div class="empty"><p>Nenhum sabor neste filtro.</p></div>`;
}

/* ---------- interações da lista ---------- */
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  filtro = b.dataset.f;
  lsSet("capsulas.filtro", filtro);
  render();
});
$("#q").addEventListener("input", (e) => {
  busca = e.target.value;
  render();
});
$("#machine").value = maquina;
$("#machine").addEventListener("change", (e) => {
  maquina = e.target.value;
  lsSet("capsulas.maquina", maquina);
  render();
});

$("#list").addEventListener("click", async (e) => {
  if (e.target.closest("[data-open=pick]")) return abrirPick();
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const card = b.closest(".card");
  const x = items.find((i) => i.id === card.dataset.id);
  if (!x) return;
  const est = Number(x.estoque) || 0;
  const act = b.dataset.act;
  if (act === "editar") return abrirEdit(x);
  const novo = act === "mais" ? est + 1 : Math.max(0, est - 1);
  if (novo === est) return;
  b.disabled = true;
  try {
    await store.update(x.id, { estoque: novo });
  } catch (err) {
    console.warn(err);
    b.disabled = false;
  }
});

/* ---------- editor ---------- */
const dlgEdit = $("#dlgEdit");
let editando = null;
let rascunho = null;
let delArmado = false;

function abrirEdit(x) {
  editando = x || null;
  rascunho = x
    ? { temp: x.temp || "quente", passos: (x.passos || []).map((p) => ({ ...p })) }
    : { temp: "quente", passos: [{ rotulo: "Café", barras: 2 }] };
  if (!rascunho.passos.length) rascunho.passos = [{ rotulo: "Café", barras: 2 }];
  $("#editTitle").textContent = x ? "Editar cápsula" : "Nova cápsula";
  $("#fNome").value = x?.nome || "";
  $("#fCat").value = x?.categoria || "cafe";
  $("#fEstoque").value = x ? Number(x.estoque) || 0 : 0;
  $("#fNota").value = x?.nota || "";
  const del = $("#btnDel");
  del.hidden = !x;
  delArmado = false;
  del.classList.remove("armed");
  del.textContent = "Excluir";
  renderRascunho();
  dlgEdit.showModal();
}
function renderRascunho() {
  $("#fTemp")
    .querySelectorAll("button")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === rascunho.temp)));
  $("#fQtd")
    .querySelectorAll("button")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.v) === rascunho.passos.length)),
    );
  const dois = rascunho.passos.length > 1;
  $("#stepEdits").className = "steps " + (rascunho.temp === "frio" ? "cold-c" : "hot-c");
  $("#stepEdits").innerHTML = rascunho.passos
    .map(
      (p, i) => `
    <div class="step-edit" data-i="${i}">
      <label class="field" for="fRot${i}"><span class="label">${dois ? i + 1 + "ª cápsula" : "Cápsula"}</span>
        <input type="text" id="fRot${i}" value="${esc(p.rotulo)}" maxlength="30" placeholder="${dois && i === 0 ? "Leite" : "Café"}"></label>
      <div class="field"><span class="label">Barras de água · ≈${p.barras * ML_POR_BARRA} ml</span>
        <div class="ledpick" role="group" aria-label="Barras de água">${Array.from({ length: 7 }, (_, k) => `<button type="button" data-b="${k + 1}" class="${k < p.barras ? "on" : ""}" aria-pressed="${k + 1 === p.barras}">${k + 1}</button>`).join("")}</div>
      </div>
    </div>`,
    )
    .join("");
}
function lerRotulos() {
  rascunho.passos.forEach((p, i) => {
    const el = $("#fRot" + i);
    if (el) p.rotulo = el.value.trim() || p.rotulo;
  });
}
$("#fTemp").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  lerRotulos();
  rascunho.temp = b.dataset.v;
  renderRascunho();
});
$("#fQtd").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  lerRotulos();
  const n = Number(b.dataset.v);
  if (n === 2 && rascunho.passos.length === 1)
    rascunho.passos = [
      { rotulo: "Leite", barras: 4 },
      { ...rascunho.passos[0], barras: Math.min(rascunho.passos[0].barras, 3) },
    ];
  if (n === 1 && rascunho.passos.length === 2) rascunho.passos = [rascunho.passos[1]];
  renderRascunho();
});
$("#stepEdits").addEventListener("click", (e) => {
  const b = e.target.closest("[data-b]");
  if (!b) return;
  lerRotulos();
  const i = Number(b.closest(".step-edit").dataset.i);
  rascunho.passos[i].barras = Number(b.dataset.b);
  renderRascunho();
});
$("#formEdit").addEventListener("submit", async (e) => {
  e.preventDefault();
  lerRotulos();
  const nome = $("#fNome").value.trim();
  if (!nome) return $("#fNome").focus();
  const dados = {
    nome,
    categoria: $("#fCat").value,
    temp: rascunho.temp,
    passos: rascunho.passos.map((p) => ({ rotulo: p.rotulo || "Cápsula", barras: p.barras })),
    estoque: Math.max(0, Math.min(999, parseInt($("#fEstoque").value, 10) || 0)),
    nota: $("#fNota").value.trim(),
  };
  const btn = $("#btnSave");
  btn.disabled = true;
  try {
    if (editando) await store.update(editando.id, dados);
    else await store.add(dados);
    dlgEdit.close();
  } catch (err) {
    console.warn(err);
    btn.textContent = "Não salvou. Tente de novo";
  } finally {
    btn.disabled = false;
    setTimeout(() => {
      btn.textContent = "Salvar";
    }, 2500);
  }
});
$("#btnDel").addEventListener("click", async () => {
  const b = $("#btnDel");
  if (!delArmado) {
    delArmado = true;
    b.classList.add("armed");
    b.textContent = "Toque de novo para excluir";
    return;
  }
  b.disabled = true;
  try {
    await store.remove(editando.id);
    dlgEdit.close();
  } catch (err) {
    console.warn(err);
  } finally {
    b.disabled = false;
  }
});

/* ---------- lista pronta ---------- */
const dlgPick = $("#dlgPick");
let escolhas = {};
function abrirPick() {
  escolhas = {};
  renderPick();
  dlgPick.showModal();
}
function renderPick() {
  const jaTem = new Set((items || []).map((x) => String(x.nome).toLowerCase()));
  $("#picklist").innerHTML = MODELOS.map((m, i) => {
    const n = escolhas[i] || 0;
    const resumo =
      m.passos.map((p) => `${p.rotulo} ${p.barras}`).join(" → ") +
      (m.temp === "frio" ? " · fria" : "");
    return `<div class="pickrow ${n ? "sel" : ""}" data-i="${i}">
      <div><b>${esc(m.nome)}</b>${jaTem.has(m.nome.toLowerCase()) ? ` <span class="pill low">já no catálogo</span>` : ""}<small>${esc(resumo)}</small></div>
      <div class="stock"><button data-d="-1" aria-label="Menos ${esc(m.nome)}" ${n ? "" : "disabled"}>−</button><output><b>${n}</b></output><button data-d="1" aria-label="Mais ${esc(m.nome)}">+</button></div>
    </div>`;
  }).join("");
  const sel = Object.values(escolhas).filter(Boolean).length;
  $("#pickCount").textContent = sel
    ? `${sel} ${sel === 1 ? "sabor selecionado" : "sabores selecionados"}`
    : "Nada selecionado";
  $("#pickAdd").disabled = !sel;
}
$("#picklist").addEventListener("click", (e) => {
  const b = e.target.closest("[data-d]");
  if (!b) return;
  const i = Number(b.closest(".pickrow").dataset.i);
  escolhas[i] = Math.max(0, (escolhas[i] || 0) + Number(b.dataset.d));
  renderPick();
});
$("#pickAdd").addEventListener("click", async () => {
  const btn = $("#pickAdd");
  btn.disabled = true;
  btn.textContent = "Adicionando…";
  try {
    for (const [i, n] of Object.entries(escolhas)) {
      if (!n) continue;
      const m = MODELOS[i];
      const existente = (items || []).find(
        (x) => String(x.nome).toLowerCase() === m.nome.toLowerCase(),
      );
      if (existente)
        await store.update(existente.id, { estoque: (Number(existente.estoque) || 0) + n });
      else await store.add({ ...m, passos: m.passos.map((p) => ({ ...p })), estoque: n, nota: "" });
    }
    dlgPick.close();
  } catch (err) {
    console.warn(err);
  } finally {
    btn.textContent = "Adicionar ao catálogo";
  }
});

/* ---------- geral ---------- */
document
  .querySelectorAll("[data-close]")
  .forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
$("#openNew").addEventListener("click", () => abrirEdit(null));
$("#openPick").addEventListener("click", abrirPick);

render();
iniciar();
