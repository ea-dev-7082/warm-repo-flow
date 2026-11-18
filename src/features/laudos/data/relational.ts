import { supabase } from '@/integrations/supabase/client';

/** The compatibility object is reconstructed from relational rows, never xml_dados. */
export function mapRelationalLaudo(row: any) {
  return {
    id: row.id,
    cliente: row.cliente_nome,
    nfGarantia: row.nf_garantia,
    data: row.data_registro || row.created_at,
    nfInterna: row.nf_interna || '',
    docAssinatura: row.documento_assinatura,
    pagamento: row.pagamento,
    notaPaga: row.nota_paga,
    conferente_fabricante: row.conferentes_fornecedores || {},
    statusLaudo: row.status?.toLowerCase() === 'finalizado' ? 'finalizado' as const : 'aberto' as const,
    responsavel: row.responsavel_nome || undefined,
    responsavelId: row.responsavel_id || undefined,
    referenciaColuna: row.referencia || undefined,
    produtoDescricao: row.produto_descricao || undefined,
    produtos: Array.isArray(row.produtos) ? row.produtos : [],
  };
}

export async function fetchRelationalLaudos() {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('laudos_leitura').select('*')
      .order('created_at', { ascending: false }).order('id')
      .range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

export async function saveRelationalLaudo(id: string | null, dados: any) {
  const { data, error } = await supabase.rpc('salvar_laudo_relacional', { p_id: id, p_dados: dados });
  if (error) throw error;
  const { data: row, error: readError } = await supabase.from('laudos_leitura').select('*').eq('id', data).single();
  if (readError) throw readError;
  return mapRelationalLaudo(row);
}