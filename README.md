# Minhas Cápsulas

Catálogo pessoal de cápsulas Nescafé Dolce Gusto: como preparar cada sabor (quantas barras de água, quente ou fria, em que ordem) e quantas bebidas ainda tem em estoque. Os dados ficam na sua conta Google, pelo Firebase, e aparecem iguais no celular e no computador.

**Site:** https://dancarvalhodev.github.io/gerenciador-de-capsulas/ (no ar depois que o GitHub Pages for ativado)

## O que o app faz
- **Cartão por sabor** com as cápsulas na ordem de uso e as barras de água (1 a 7, a escala da tampa), com os ml aproximados.
- **Modo da máquina:** com seletor de nível, o cartão destaca as barras; na manual, destaca "pare em ≈X ml".
- **Estoque:** botões − e +, e "Fazer uma" desconta 1. Selos "Acabando" e "Esgotado".
- **Filtros e busca** por tipo, gelados, acabando e nome.
- **Adicionar da lista:** sabores prontos, com a quantidade que chegou na caixa.
- Tema claro e escuro, funciona no celular.

As barras da lista pronta são **sugestões**, não dados oficiais. Confira a tampa da cápsula e edite o cartão se for diferente.

## Rodar no seu computador
```bash
python3 -m http.server 8000
```
Rode na pasta do projeto e abra `http://localhost:8000`. Abrir o `index.html` direto, sem o servidor, não funciona: os arquivos de JavaScript e o login do Google precisam de um endereço `http://`.

## Documentação
- [O Firebase deste app](docs/firebase.md): login, regras de segurança e onde os dados ficam, explicados com analogias.
- [Como o app funciona](docs/como-o-app-funciona.md): o papel de cada arquivo e o caminho de um clique até o dado salvo.
- [Plano de implementação](.claude/plans/mvp-github-pages-firebase.md)
