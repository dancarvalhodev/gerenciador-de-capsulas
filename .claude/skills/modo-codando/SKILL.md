---
name: modo-codando
description: Executa um plano de desenvolvimento gerado pelo Claude, uma etapa por vez, parando ao fim de cada etapa para o dev conferir e só avançando após a confirmação dele. Recusa a execução se o plano não tiver etapas definidas. Use sempre que o usuário pedir para executar, implementar, continuar ou retomar um plano ("pode executar o plano", "executa o plano salvo", "segue para a próxima etapa", "modo codando", "/modo-codando"), mesmo que ele não cite a skill pelo nome.
argument-hint: "[caminho do plano]"
---

# Modo codando

Você está programando ao lado de um dev que quer revisar o trabalho em blocos pequenos. O plano
já foi pensado e aprovado; o seu papel agora é executá-lo etapa por etapa, entregando cada uma
para conferência antes de tocar na seguinte.

O motivo: quando várias etapas são emendadas, o dev recebe um diff grande demais para revisar e
um erro cometido cedo contamina tudo o que veio depois. Parar em cada etapa mantém o diff
pequeno, o erro barato de corrigir e o dev no controle do rumo.

Em caso de conflito, o `CLAUDE.md` do projeto vale mais do que esta skill.

## 1. Localizar o plano

Procure nesta ordem e use o primeiro que existir:

1. O caminho passado como argumento.
2. Um plano escrito ou aprovado nesta conversa (por exemplo, ao sair do modo de planejamento).
3. Os arquivos em `.claude/plans/` do repositório (hoje, `mvp-github-pages-firebase.md`). Havendo
   mais de um, pergunte qual executar.

Se não houver plano, não improvise a partir de um pedido solto: diga que não encontrou um plano e
ofereça-se para elaborar um, em etapas, para o dev aprovar. A execução só começa depois disso.

## 2. Conferir se o plano tem etapas

O plano precisa de uma lista explícita e ordenada de etapas — neste projeto, a seção `## Passos`,
com itens numerados em que cada um diz o que será entregue.

Não conta como etapas: uma descrição de arquitetura em prosa, uma lista de arquivos ou de
tecnologias, ou uma única etapa do tipo "implementar tudo".

Se não houver etapas, **recuse a execução**. Explique o que falta e ofereça-se para reescrever o
plano em etapas; depois que o dev aprovar a nova versão, comece. Não invente as etapas por conta
própria e saia executando: a divisão em etapas define onde o dev vai poder intervir, então é ele
quem precisa concordar com ela.

Uma etapa grande demais para ser conferida de uma vez é um problema parecido. Proponha
dividi-la em subetapas (4a, 4b, 4c...) antes de começar, perguntando ao dev como ele prefere
dividir. **Registre a divisão no plano antes de escrever qualquer arquivo da etapa.** Antes de
usar uma letra, confira se ela já não existe em outro ponto do plano.

**Etapa nova ou alterada no plano precisa de validação.** Se o dev pediu para só alterar o plano
("não execute nada ainda"), a etapa não está aprovada até ele dizer que está.

## 3. Antes da primeira etapa

Leia o `CLAUDE.md` (regras do projeto e "Estado atual", que diz onde o trabalho parou) e o plano
inteiro. Diga, em poucas linhas, quantas etapas há e qual será executada agora.

**Questione a etapa quando ela não valer o custo.** Se a próxima etapa for cara e trouxer pouco
retorno para um projeto deste tamanho, diga isso antes de começar, com a sua recomendação. A
decisão continua sendo do dev.

Para retomar um plano em andamento, veja quais passos já têm ✅ no plano e confira o estado real
do repositório (`git status`, `git log`). Continue da primeira etapa não confirmada, sem refazer
as anteriores.

## 4. Executar uma etapa

- **Fique dentro da etapa.** Não adiante trabalho da próxima, mesmo que pareça óbvio ou rápido.
  Um arquivo que só funciona com o que vem depois deixa a etapa atual impossível de conferir.
- **MVP sempre.** Use o mínimo de arquivos e funções que resolve a etapa de hoje. Nada de cache,
  validador ou camada "para o futuro". Ideias extras vão para o "Roadmap" do plano, não para o
  código.
- **Sem build e sem npm.** HTML, CSS e JS vanilla em arquivos separados, como diz o `CLAUDE.md`.
- **Código claro para quem não conhece Firebase.** Nomes em português que dizem a ação
  (`entrarComGoogle`, `quantidadeEmEstoque`), sem abreviações de uma letra fora de callbacks
  curtos e sem mágica desnecessária (nada de regex onde um laço basta).
- **Comente o porquê, de forma curta.** Comente o que o código não mostra sozinho (uma restrição
  externa, uma armadilha) e toda chamada ao Firebase, com uma linha que use a analogia casa /
  porteiro / armário / gaveta / ficha. Não escreva comentários que narram o que a linha faz nem
  que anunciam etapas futuras. Explicações longas vão para a documentação do projeto (veja a
  seção 5), não para o arquivo.
- **Verifique o que fez.** Não há testes automatizados nem navegador neste ambiente. Rode o que
  der, um comando por vez:
  - `node --check <arquivo>.js` em cada JS alterado;
  - `npx --yes prettier@3.3.3 --check <arquivos>` (ou `--write` para formatar);
  - um script de teste no scratchpad que importe as funções puras (`html.js`, `dados.js`) e
    imprima o resultado, quando a etapa mexer nelas;
  - `curl` no servidor local (`python3 -m http.server 8000` na raiz) para confirmar que os
    arquivos carregam, quando a etapa mudar caminhos.
  O que depende do navegador (login, Firestore, tela) fica para o dev testar: diga isso no
  relatório e liste os passos.
- **Prefira comandos pequenos e de propósito único**, com caminhos absolutos, sem juntar ações
  com `&&`, `;` ou `|`. Para ler e alterar arquivos, use as ferramentas Read, Edit e Write. Este
  repositório não tem CodeGraph.
- **Apagar ou mover arquivos é com o dev.** O `rm` está bloqueado para você. Liste o comando
  `! rm ...` (ou `! git mv ...`) para ele rodar e, depois que ele confirmar, rode a verificação.
- **Se um comando for recusado, não insista** com o mesmo comando nem contorne por outro
  caminho. Registre no relatório o que ficou sem rodar.
- **Desvios do plano são decisão do dev.** Se a etapa pedir algo que o plano não previa ou que se
  mostrou inviável, pare e pergunte, em vez de escolher em silêncio.
- **O console do Firebase é do dev.** Você não tem acesso a ele: quando a etapa precisar de algo
  lá (regras, domínios autorizados, provedor de login), oriente um passo de cada vez.
- **O git é do dev.** Esta skill não adiciona arquivos ao git nem faz commit, em nenhuma
  circunstância: nada de `git add`, `git commit`, `git push`, `git stash` ou abertura de PR, nem
  ao fim de uma etapa, nem "para deixar pronto". Isso vale mesmo que o plano cite commits entre
  as etapas: nesse ponto, pare e avise que é a vez dele. O que continua permitido é consultar
  (`git status`, `git diff`, `git log`) e, quando o dev pedir, escrever o texto de uma mensagem
  de commit para ele usar. Nesse caso:
  - antes, confira o `git status` e avise se o staging não tiver tudo o que a etapa mudou;
  - comece com um gitmoji que combine com a mudança (`:sparkles:`, `:recycle:`, `:wrench:`,
    `:memo:`...) e um resumo em português;
  - no corpo, use tópicos que expliquem o quê e o porquê;
  - termine com `Co-Authored-By: <nome do modelo atual> <noreply@anthropic.com>`, conferindo o
    nome do modelo no início da sessão.

## Como explicar

- **O dev não conhece Firebase.** Use português simples, sem jargão, um passo de cada vez.
- **Comece pela analogia.** Explicações curtas, que abrem com uma analogia (casa / endereço /
  porteiro / armário / gaveta / ficha, para o Firebase) e depois a ligam ao código.
- **Conceito antes do código.** Em um assunto que o dev diz não conhecer, explique a ideia antes
  de mostrar o que mudou.
- **Confira arquivos enviados.** Se uma imagem ou outro arquivo aparecer só como um ícone
  genérico, e não com o conteúdo de verdade, avise e peça para ele enviar de novo antes de
  seguir.

## 5. Entregar a etapa

Ao terminar, encerre o turno com um relatório neste formato:

```
**Etapa N de T — <título>: concluída**

O que foi feito:
- <arquivos criados ou alterados e o que cada um faz>

Como funciona:
<explicação curta das alterações, começando por uma analogia>

Documentação:
- <documento de docs/ ou README criado ou atualizado; omita se a etapa não mudou nenhum assunto documentado>

Diferenças em relação ao plano:
- <desvios e por quê; omita a seção se não houve>

O que verifiquei:
- <comandos rodados e o resultado; o que NÃO pôde ser verificado e por quê>

Para conferir:
<comandos ou passos no navegador, com o resultado esperado>

Está tudo correto? Posso seguir para a etapa N+1 — <título>?
```

Seja fiel sobre o estado: se nada foi testado, escreva isso no título ("arquivos escritos, não
testados") em vez de "concluída". O dev decide com base nesse relatório.

A documentação faz parte da etapa. A documentação do projeto fica em `docs/` (um documento por
assunto, com o porquê das decisões) e no `README.md`; enquanto a pasta `docs/` não existir, use
o `README.md`. Ao mudar o comportamento de um assunto documentado, atualize o documento na mesma
etapa. As dúvidas que o dev levantar durante a conferência também entram no documento, quando
ele concordar.

Depois da pergunta, **pare**. Não comece a etapa seguinte no mesmo turno e não a prepare "para
adiantar".

## 6. Esperar a confirmação

Só avance com um sim claro: "está correto", "pode seguir", "ok, próxima". Um comentário ou um
"commitei" não é aprovação.

- **Pedido de ajuste ou erro apontado:** corrija dentro da mesma etapa, entregue de novo e
  pergunte outra vez. A etapa só fecha com a confirmação.
- **Pergunta ou comentário sem aprovação:** responda e continue esperando. Uma dúvida não é um
  sim.
- **Resposta ambígua:** pergunte se pode seguir.
- **Pedido para pular, reordenar ou juntar etapas:** o dev manda. Faça como pedido e registre a
  mudança no plano.

## 7. Registrar o progresso

O progresso fica na própria lista de `## Passos` do plano, para que outra sessão consiga retomar
de onde esta parou:

- etapa confirmada: `✅` no início do item;
- etapa entregue e ainda não confirmada: `(entregue, aguardando conferência)` no fim do título;
- etapa seguinte: `**Este é o próximo passo.**`, como o plano já faz.

Marque `✅` só depois da confirmação do dev, nunca ao terminar de escrever o código.

Ao fim de cada etapa confirmada, atualize também a seção "Estado atual" do `CLAUDE.md` (o que foi
feito, o que falta testar e decisões novas), para que o trabalho possa continuar em outra sessão
ou em outro computador.

## 8. Fim do plano

Confirmada a última etapa, faça um resumo curto: o que foi entregue, o que ficou pendente ou
sem verificação, e os próximos passos que dependem do dev (commit, push, console do Firebase).
Lembre que o trabalho vai direto na `master` e que, com o GitHub Pages ativado, cada push nela
atualiza o site publicado.
