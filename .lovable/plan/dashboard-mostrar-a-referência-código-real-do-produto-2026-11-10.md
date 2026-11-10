# Dashboard: mostrar a referência (código real) do produto

## O que muda
- Na tabela "Movimentações recentes", a coluna **Produto** passa a mostrar só o código de referência (ex.: `93.430R`) em vez do nome.
- O gráfico "Produtos com mais garantia" e o card "Produto com mais ocorrências" passam a agrupar e exibir pela mesma referência.

## Como a referência é encontrada
Para cada laudo:
1. Pega o código salvo no laudo (`produto_codigo`, ex.: `*90284`).
2. Procura, na lista de produtos dentro de `xml_dados`, o item cujo `codigo` é igual a esse código.
3. Usa o campo `referencia` desse item.
4. Se não achar (laudo antigo/sem dados), mostra o próprio `produto_codigo` como reserva.

Conferido nos dados atuais: ex. laudo com código `*90284` -> referência `93.430R`; `COM-95160RD` -> `95.160RD`.

## Detalhes técnicos
- Arquivo: `src/features/dashboard/pages/Dashboard.tsx`.
- Incluir `produto_codigo, xml_dados` nos três selects.
- Função auxiliar `getReferencia(row)` (comparação de `codigo` com trim), usada na tabela, no card e no gráfico.
- Título do gráfico e rótulo "Produto" ficam como estão (você ajustará depois).
