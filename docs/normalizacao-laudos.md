# Normalização dos laudos

## Estado da transição

- `laudos` contém o cabeçalho; `laudo_itens` contém cada produto unitário, posição e avaliação; `laudo_item_componentes` relaciona os códigos avaliados/reaproveitados e os fornecedores.
- Histórico inicial: 59 laudos, 266 itens, 647 relações de componentes. Não foram feitas consultas ao ERP para reescrever o histórico.
- As telas leem `laudos_leitura`, uma view `security_invoker` reconstruída exclusivamente das tabelas. A paginação evita o limite de 1.000 laudos.
- A RPC `salvar_laudo_relacional` valida login, responsabilidade/admin ou alterações exclusivas de conferência. Ela mantém o JSON de compatibilidade; triggers materializam os três níveis na mesma transação. O JSON ainda não foi desativado na escrita.
- Identidade dos itens é preservada por posição dentro do laudo; componentes por código dentro do item. A remoção de um laudo exclui os filhos em cascata.
- `fornecedor_id_fnc` só é vinculado quando o nome histórico coincide com um cadastro de fornecedor. O nome original permanece no registro. Quantidade de composição não é inferida quando ausente do snapshot.
- A conferência mantém a granularidade da tela atual (produto); não foi introduzida conferência independente por componente.

## Verificação

- Testes da migration verificam criação, edição, identidade, ordem, conferência, recusa de edição por outro usuário, recusa anônima e cascata. Dados temporários são revertidos.
- Testes locais: `src/features/laudos/data/relational.test.ts`.
- A comparação do histórico detectou três valores com três casas decimais. As colunas monetárias foram ampliadas para `numeric` sem escala limitada, e os valores foram recuperados do JSON intacto.
- Verificação autenticada na interface indisponível neste Supabase externo. A página de login abre sem erros de execução.

## Segurança

- A RPC é intencionalmente `SECURITY DEFINER`, com acesso exclusivo para autenticados e validações de autorização; o aviso genérico do linter permanece documentado, não significa liberação de acesso anônimo.
- Existem avisos anteriores de segurança nas tabelas de catálogo/cadastros e funções/configurações de autenticação; não foram tratados neste trabalho.

## Homologação antes de desativar o JSON

Publicar a versão atual; conferir criação via XML, edição, finalização, impressão, nota anexada e tratamento de fornecedor com um usuário real. Não remover `xml_dados` antes dessa homologação.