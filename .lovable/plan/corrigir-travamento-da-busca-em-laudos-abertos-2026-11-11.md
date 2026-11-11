# Corrigir travamento da busca em Laudos Abertos

## Problema
Alguns produtos salvos nos laudos têm o código gravado como número (ex.: 91201) em vez de texto. A busca tenta tratar esse valor como texto e a página quebra assim que um número é digitado.

## O que muda
- A busca da página Laudos Abertos passa a converter cada campo (cliente, NF, referência, descrição e código do produto) em texto antes de comparar. Assim, tanto números quanto textos são encontrados, e a página não quebra mais.
- A mesma proteção será aplicada na busca da página Histórico, que usa a mesma lógica.

## Detalhes técnicos
- Criar helper `matches(value, term)` usando `String(value ?? "").toLowerCase().includes(term)` e usar em todos os campos do filtro em `LaudosAbertos.tsx` (e em `Historico.tsx`, se houver o mesmo padrão).
- Verificar digitando um número na busca via Playwright.
