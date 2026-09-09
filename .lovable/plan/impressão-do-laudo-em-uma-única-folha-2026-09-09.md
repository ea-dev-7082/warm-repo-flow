# Impressão do laudo em uma única folha

## Problema

Ao imprimir o laudo, alguns casos "vazam" poucas linhas para uma segunda folha. Hoje a janela de impressão é aberta com um tamanho fixo (A4 paisagem, margem 10mm) e sem nenhum ajuste automático: se o conteúdo passar por 1 cm, ele quebra em duas páginas, e nem o menu de impressão do computador (que varia de máquina para máquina) permite corrigir.

## Solução

Antes de mandar imprimir, o sistema mede a altura real do laudo e, se ele passar um pouco da página, reduz proporcionalmente o conteúdo até caber em uma folha só. Nada é cortado — o laudo apenas encolhe alguns por cento, mantendo tudo legível.

Além disso:
- Evitar quebra no meio de blocos (cabeçalho, tabelas, assinatura), para nunca sobrar "um item solto" na segunda folha.
- Margem da página reduzida para 8mm, ganhando espaço útil.
- Um seletor simples ao lado do botão Imprimir: **Automático (uma folha)** / **Tamanho normal**, caso o usuário prefira o comportamento antigo.

Aplicado aos dois laudos (Cliente e Interno) e também ao Tratamento do Fornecedor e ao Laudo de Garantia, que usam a mesma lógica de impressão.

## Detalhes técnicos

- Extrair a lógica de impressão duplicada para um utilitário `src/app/utils/printDocument.ts` que recebe o `elementId`, o CSS já existente e opções (`orientation`, `fit`).
- Na janela de impressão: aguardar `printWin.document.readyState === 'complete'` (em vez do `setTimeout` fixo de 400ms, que também causa impressões inconsistentes em máquinas lentas), medir `scrollHeight` do wrapper contra a altura útil da página (A4 paisagem ≈ 210mm − margens, convertido em px a 96dpi).
- Se `contentHeight > pageHeight`, aplicar `transform: scale(f)` com `transform-origin: top left`, `f = pageHeight / contentHeight`, limitado a um mínimo de 0.7; abaixo disso, deixar paginar normalmente.
- Adicionar no CSS de impressão: `break-inside: avoid` nos blocos de seção/linha de tabela e `html, body { height: auto }`.
- Não alterar o conteúdo nem os cálculos do laudo — mudança apenas de apresentação/impressão.
