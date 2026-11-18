# Buscar kits e componentes direto do ERP (API Firebird)

Só muda de onde o app LÊ o catálogo. Nada é gravado ou alterado no Supabase; os laudos continuam salvos como hoje.

## O que o usuário vai notar
- **Nova Análise:** ao digitar o código do kit, aparece "Buscando no ERP..." e o app preenche descrição e referência atuais e a lista de componentes (com fabricante e quantidade no kit). Se o ERP não responder, aparece um aviso e o preenchimento manual continua liberado.
- **Tratamento com Fornecedor:** descrições/referências das peças vêm do ERP numa única busca em lote, com um indicador discreto de carregamento na tabela.
- Buscas repetidas do mesmo kit são instantâneas (ficam guardadas por alguns minutos).

## Consultas (Firebird 2.5, via POST /agent/sql)
1. **Kit + composição** (1 chamada):
```text
select pc.produto as produto_kit, ek.nome as kit_descricao, ek.referencia as kit_referencia,
       pc.item as componente_codigo, pc.qtd as qtd_no_kit, e.nome as descricao,
       e.referencia, e.fabricante as fabricante_codigo, fab.nome as fabricante
from pdt_composto pc
inner join est ek on ek.produto = pc.produto
inner join est e  on e.produto  = pc.item
left join fab on fab.fabricante = e.fabricante
where pc.produto = ? order by pc.item
```
2. **Produto avulso (sem composição)** — fallback: `select produto, nome, referencia, fabricante from est where produto = ?`
3. **Componentes em lote** — `... from est e left join fab ... where e.produto in (?, ?, ...)`, dividido em blocos de 500 códigos (limite do `IN` no Firebird 2.5), blocos disparados em paralelo.

## Detalhes técnicos
- **Função de backend `firebird-catalog`** (proxy seguro): guarda a chave X-API-KEY como segredo do servidor (não fica no navegador), exige usuário logado e só aceita 3 operações nomeadas (`kit`, `produto`, `componentes`) com parâmetros — o navegador nunca envia SQL livre. Normaliza as respostas (chaves MAIÚSCULAS do Firebird -> camelCase, `trim` nos textos, números como número) e devolve JSON tipado:
```text
{ kit: { codigo, descricao, referencia } | null,
  componentes: [{ codigo, descricao, referencia, fabricanteCodigo, fabricante, qtdNoKit }] }
```
- **Cliente** `src/integrations/firebird/catalog.ts`: tipos + `getKitComposition(code)` e `getComponentsByCodes(codes)` (chunking e remoção de duplicados).
- **Hooks com React Query** em `src/features/laudos/hooks/useErpCatalog.ts`: `useKitComposition(code)` (habilitado só com código de 3+ caracteres, disparado com debounce de ~400 ms, `staleTime` de 5 min) e `useComponentsInfo(codes)` (chave estável com códigos ordenados). Isso substitui o `useEffect` + `useState` manuais — sem buscas duplicadas, sem cascata de re-renderizações e com estados `isFetching`/erro prontos.
- **LaudoTecnico.tsx:** `searchProductByCode`/`fetchComponentsForProduct` passam a usar o hook; `componentOptions` é derivado do cache (useMemo) em vez de estado sincronizado; fabricante do componente pré-preenchido.
- **TratamentoFornecedor.tsx:** o `useEffect` que consulta `componentes_kit` vira `useComponentsInfo`; `componentDescriptions` vira valor derivado.
- `produtos_kit`/`componentes_kit` deixam de ser lidas pelo app, mas não são apagadas.
- Será pedido o valor da chave da API para salvar como segredo do servidor (a chave enviada no chat deve ser trocada depois).
- Registrar no AGENTS.md: "Leituras do ERP passam pela função `firebird-catalog` com operações nomeadas; o cliente nunca envia SQL."
