# Minhas Cápsulas

Catálogo pessoal de cápsulas Nescafé Dolce Gusto compradas avulsas (caixa personalizada), para saber como preparar cada uma e controlar o estoque. Os dados ficam no Firebase e sincronizam entre aparelhos; o site é publicado no GitHub Pages.

> Plano de implementação: [`.claude/plans/mvp-github-pages-firebase.md`](.claude/plans/mvp-github-pages-firebase.md)

## O que o app faz
- **Cartão por sabor**: nome, tipo (café puro / com leite / chocolate / chá e outros), água quente ou fria, e as cápsulas em ordem (bebidas de 2 cápsulas: normalmente leite primeiro, depois café ou chocolate).
- **Barras de água** de 1 a 7 (a escala impressa na tampa), desenhadas como os LEDs do painel da máquina, com ml aproximados (30 ml por barra).
- **Modo da máquina** (seletor no topo):
  - *Com seletor de nível* (Mini Me, Genio S, Infinissima Touch): destaca as barras.
  - *Manual* (Piccolo XS, Oblo, Esperta, Infinissima): destaca "pare em ≈X ml".
- **Estoque** em bebidas: botões − / +, e "Fazer uma" desconta 1. Selos "Acabando" (≤ 2) e "Esgotado" (0); esgotados vão para o fim da lista.
- **Filtros**: Todas, Café puro, Com leite, Chocolate, Chás e outros, Gelados, Acabando. Também tem busca por nome.
- **Adicionar da lista**: lista pronta de sabores com quantidade por sabor; soma ao estoque se o sabor já existe.
- **Nova cápsula / Editar**: formulário em `<dialog>`; a exclusão pede um segundo toque para confirmar.
- Tema claro e escuro automáticos, layout responsivo (funciona no celular).

## Aviso
As barras e os valores da lista pronta são **sugestões**, não dados oficiais. Confira a tampa de cada cápsula e edite o cartão se for diferente.

## Rodar localmente
```bash
python3 -m http.server 8000
```
Abra `http://localhost:8000`. É preciso servir por HTTP (não abrir o arquivo direto) por causa dos módulos JS e do login do Firebase.
