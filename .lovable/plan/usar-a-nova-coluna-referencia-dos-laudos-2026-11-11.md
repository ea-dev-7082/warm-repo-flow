# Usar a nova coluna "referencia" dos laudos

## O que muda
- **Dashboard** (tabela, gráfico e card "Produto com mais ocorrências"): passa a ler direto da coluna `referencia`. Se vazia, mostra a descrição do produto.
- **Relatórios** (gráfico de produtos com mais ocorrências): passa a contar pela coluna `referencia` (um por laudo). Se vazia, usa a descrição.
- **Histórico**: a coluna "Produtos" mostra a `referencia`; se vazia, a descrição.
- **Salvar laudo** (nova análise, edição, tratamento de fornecedor): sempre que o laudo for criado ou atualizado, a referência do primeiro produto também é gravada na coluna `referencia` (junto com `produto_codigo`, como já ocorre hoje).

## Detalhes técnicos
- `Dashboard.tsx`: remover `getReferencia` baseado em `xml_dados`; selects passam a pedir `referencia, produto_descricao`; helper `ref = row.referencia?.trim() || row.produto_descricao || "Sem código"`.
- `Relatorios.tsx`: gráfico de ocorrências agrupa por `l.referencia` com fallback `produto_descricao` (demais gráficos que usam `xml_dados.produtos` ficam como estão).
- `LaudosContext.tsx`: mapear `referencia` e `produtoDescricao` vindos da linha; em `adicionarLaudo` gravar `referencia: produtos[0].referencia`; em `atualizarLaudo`, quando `dados.produtos` vier, atualizar `referencia`, `produto_codigo` e `produto_descricao`.
- `Historico.tsx`: `produto: l.referencia || l.produtos?.[0]?.descricao || "Vários produtos"`.
- Os tipos do banco ainda podem não ter a coluna; uso de cast onde necessário.
