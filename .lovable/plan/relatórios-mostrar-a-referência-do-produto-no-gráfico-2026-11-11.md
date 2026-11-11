# Relatórios: mostrar a referência do produto no gráfico

## O que muda
- No gráfico "Produtos com mais ocorrências" da tela de Relatórios, cada barra passa a mostrar a **referência** do produto (ex.: `93.430R`) em vez do nome.
- A referência continua sendo lida de dentro dos dados do XML salvos em cada laudo, item por item.
- Se um item não tiver referência preenchida, mostra o código do item; se nem isso existir, mostra "Sem código".
- A importação de XML e o Dashboard ficam como estão.

## Detalhe técnico
- Em `src/features/laudos/pages/Relatorios.tsx`, no cálculo de `productCounts`, trocar a chave `p.descricao` por `p.referencia?.trim() || p.codigo?.trim() || "Sem código"`.
