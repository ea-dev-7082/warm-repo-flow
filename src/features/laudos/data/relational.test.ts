import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { mapRelationalLaudo } from '@/features/laudos/data/relational';

describe('three-level relational report adapter', () => {
  it('reads products from relational rows instead of the legacy snapshot', () => {
    const laudo = mapRelationalLaudo({ id: 'laudo-1', cliente_nome: 'Cliente', nf_garantia: '34959',
      status: 'Finalizado', referencia: '92.531R', produtos: [{ itemId: 'item-1', codigo: '*90193', quantidade: 1,
        itemAvaliado: '82.752, B2.495', fabricante: '{"82.752":"PRIME","B2.495":"ELASTOMEROS"}' }],
      xml_dados: { produtos: [{ codigo: 'INCORRETO' }] } });
    expect(laudo.produtos[0].codigo).toBe('*90193');
    expect(laudo.produtos[0].itemId).toBe('item-1');
    expect(laudo.produtos[0].itemAvaliado).toBe('82.752, B2.495');
    expect(laudo.referenciaColuna).toBe('92.531R');
    expect(laudo.statusLaudo).toBe('finalizado');
  });
  it('retains header, receipt and conference data from the relational columns', () => {
    const laudo = mapRelationalLaudo({ data_registro: '2026-06-19', nf_interna: '6135;',
      documento_assinatura: '34959', pagamento: 'garantia', nota_paga: 'notas/comprovante.pdf',
      responsavel_id: 'responsavel-1', conferentes_fornecedores: { PRIME: 'Analista' }, produtos: [] });
    expect(laudo.data).toBe('2026-06-19');
    expect(laudo.nfInterna).toBe('6135;');
    expect(laudo.pagamento).toBe('garantia');
    expect(laudo.notaPaga).toBe('notas/comprovante.pdf');
    expect(laudo.conferente_fabricante.PRIME).toBe('Analista');
    expect(laudo.responsavelId).toBe('responsavel-1');
  });
});