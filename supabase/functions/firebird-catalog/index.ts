import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/udc_api_firebird';
const CHUNK = 500;

const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('kit'), code: z.string().trim().min(1).max(60) }),
  z.object({ op: z.literal('componentes'), codes: z.array(z.string().trim().min(1).max(60)).min(1).max(5000) }),
]);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const num = (v: unknown) => (v == null || v === '' ? null : Number(v));

async function sql(query: string, params: unknown[]): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${GATEWAY_URL}/agent/sql?formato=objetos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      'X-Connection-Api-Key': Deno.env.get('UDC_API_FIREBIRD_API_KEY')!,
    },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`Firebird [${res.status}]: ${t}`);
    throw new Error(`[${res.status}]: ${t}`);
  }
  const body = await res.json();
  return body?.data ?? [];
}

const KIT_SQL = `select pc.produto as produto_kit, ek.nome as kit_descricao, ek.referencia as kit_referencia,
 pc.item as componente_codigo, pc.qtd as qtd_no_kit, e.nome as descricao, e.referencia,
 e.fabricante as fabricante_codigo, fab.nome as fabricante
 from pdt_composto pc inner join est ek on ek.produto = pc.produto inner join est e on e.produto = pc.item
 left join fab on fab.fabricante = e.fabricante where pc.produto = ? order by pc.item`;

const COMP_COLS = `e.produto as componente_codigo, e.nome as descricao, e.referencia,
 e.fabricante as fabricante_codigo, fab.nome as fabricante from est e left join fab on fab.fabricante = e.fabricante`;

const mapComp = (r: Record<string, unknown>) => ({
  codigo: str(r.COMPONENTE_CODIGO),
  descricao: str(r.DESCRICAO),
  referencia: str(r.REFERENCIA),
  fabricanteCodigo: num(r.FABRICANTE_CODIGO),
  fabricante: str(r.FABRICANTE),
  qtdNoKit: num(r.QTD_NO_KIT),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims, error: authErr } = await sb.auth.getClaims(auth.slice(7));
    if (authErr || !claims?.claims?.sub) return json({ error: 'Não autenticado' }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const input = parsed.data;

    if (input.op === 'kit') {
      const code = input.code.toUpperCase();
      const rows = await sql(KIT_SQL, [code]);
      if (rows.length > 0) {
        return json({
          kit: { codigo: str(rows[0].PRODUTO_KIT), descricao: str(rows[0].KIT_DESCRICAO), referencia: str(rows[0].KIT_REFERENCIA) },
          componentes: rows.map(mapComp),
        });
      }
      const single = await sql(`select ${COMP_COLS} where e.produto = ?`, [code]);
      if (single.length === 0) return json({ kit: null, componentes: [] });
      const c = mapComp(single[0]);
      return json({ kit: { codigo: c.codigo, descricao: c.descricao, referencia: c.referencia }, componentes: [] });
    }

    const codes = [...new Set(input.codes.map((c) => c.toUpperCase()))];
    const chunks: string[][] = [];
    for (let i = 0; i < codes.length; i += CHUNK) chunks.push(codes.slice(i, i + CHUNK));
    const results = await Promise.all(
      chunks.map((ch) => sql(`select ${COMP_COLS} where e.produto in (${ch.map(() => '?').join(',')})`, ch)),
    );
    return json({ componentes: results.flat().map(mapComp) });
  } catch (e) {
    return json({ error: 'Falha ao consultar o ERP', details: String((e as Error).message) }, 502);
  }
});
