// Valores fixos do app. Onde mexer em cada um: docs/como-o-app-funciona.md.

// Nome exibido para cada categoria (a chave é o que fica gravado na ficha).
export const NOMES_DAS_CATEGORIAS = {
  cafe: "Café puro",
  leite: "Café com leite",
  choco: "Chocolate",
  cha: "Chá e outros",
};

// Cada barra da escala da tampa (1 a 7) equivale a mais ou menos 30 ml de água.
export const ML_POR_BARRA = 30;

// Com esta quantidade de bebidas ou menos, o sabor ganha o selo "Acabando".
export const LIMITE_ACABANDO = 2;

// Sabores da "Adicionar da lista". Valores sugeridos: conferir na tampa de cada cápsula.
// `passos` é a ordem das cápsulas; bebidas de 2 cápsulas normalmente começam pelo leite.
// prettier-ignore
export const LISTA_PRONTA = [
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
