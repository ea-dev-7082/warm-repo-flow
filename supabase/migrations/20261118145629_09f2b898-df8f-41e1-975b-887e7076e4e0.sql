ALTER TABLE public.laudos ADD COLUMN data_registro text, ADD COLUMN nf_interna text, ADD COLUMN documento_assinatura text, ADD COLUMN pagamento text, ADD COLUMN nota_paga text, ADD COLUMN conferentes_fornecedores jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN normalizado_em timestamptz;
ALTER TABLE public.laudo_itens ALTER COLUMN quantidade TYPE numeric, ADD COLUMN posicao integer, ADD COLUMN referencia text, ADD COLUMN nf_interna text, ADD COLUMN ncm text, ADD COLUMN unidade text, ADD COLUMN recebido boolean NOT NULL DEFAULT false, ADD COLUMN quantidade_recebida numeric, ADD COLUMN data_kit text, ADD COLUMN status text, ADD COLUMN acao text, ADD COLUMN avaliacao text, ADD COLUMN fornecedor_nome text, ADD COLUMN conferido boolean NOT NULL DEFAULT false, ADD COLUMN data_conferencia text, ADD COLUMN conferente_nome text, ADD COLUMN conferente_id uuid, ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(), ADD CONSTRAINT laudo_itens_posicao_unique UNIQUE(laudo_id,posicao);
GRANT SELECT ON public.laudos, public.laudo_itens TO authenticated;
GRANT ALL ON public.laudos, public.laudo_itens TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.laudo_itens FROM authenticated;
CREATE TABLE public.laudo_item_componentes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), laudo_item_id uuid NOT NULL REFERENCES public.laudo_itens(id) ON DELETE CASCADE,
 codigo text NOT NULL, fornecedor_id_fnc integer REFERENCES public.cadastros(id_fnc) ON DELETE SET NULL, fornecedor_nome text,
 avaliado boolean NOT NULL DEFAULT false, reaproveitado boolean NOT NULL DEFAULT false, quantidade_no_kit numeric,
 conferido boolean NOT NULL DEFAULT false, data_conferencia text, conferente_nome text, conferente_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(laudo_item_id,codigo)
);
GRANT SELECT ON public.laudo_item_componentes TO authenticated;
GRANT ALL ON public.laudo_item_componentes TO service_role;
ALTER TABLE public.laudo_item_componentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY componentes_leitura ON public.laudo_item_componentes FOR SELECT TO authenticated USING (true);
CREATE INDEX laudo_item_componentes_fornecedor_idx ON public.laudo_item_componentes(fornecedor_id_fnc);
CREATE TRIGGER componentes_updated_at BEFORE UPDATE ON public.laudo_item_componentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER itens_updated_at BEFORE UPDATE ON public.laudo_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.laudo_numero(v text) RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$ BEGIN IF v IS NULL OR btrim(v)='' THEN RETURN NULL; END IF; RETURN replace(v,',','.')::numeric; EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RAISE EXCEPTION 'Valor numérico inválido no laudo: %',v; END $$;
CREATE OR REPLACE FUNCTION public.normalizar_laudo_snapshot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb; fornecedores jsonb; item_id uuid; c text; n integer; fornecedor text; avaliados text[]; reaproveitados text[];
BEGIN
 NEW.data_registro := NEW.xml_dados->>'data'; NEW.nf_interna:=NEW.xml_dados->>'nfInterna'; NEW.documento_assinatura:=NEW.xml_dados->>'docAssinatura'; NEW.pagamento:=NEW.xml_dados->>'pagamento'; NEW.nota_paga:=NEW.xml_dados->>'notaPaga'; NEW.conferentes_fornecedores:=coalesce(NEW.xml_dados->'conferente_fabricante','{}'::jsonb); NEW.normalizado_em:=now();
 RETURN NEW;
END $$;
CREATE TRIGGER normalizar_laudo_cabecalho BEFORE INSERT OR UPDATE OF xml_dados ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.normalizar_laudo_snapshot();
CREATE OR REPLACE FUNCTION public.normalizar_laudo_produtos() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb; fornecedores jsonb; item_id uuid; c text; n integer; fornecedor text; avaliados text[]; reaproveitados text[];
BEGIN
 IF NEW.xml_dados->'produtos' IS NOT NULL AND jsonb_typeof(NEW.xml_dados->'produtos')<>'array' THEN RAISE EXCEPTION 'produtos deve ser uma lista'; END IF;
 n:=0;
 FOR p IN SELECT value FROM jsonb_array_elements(coalesce(NEW.xml_dados->'produtos','[]'::jsonb)) LOOP
 n:=n+1;
 INSERT INTO public.laudo_itens(laudo_id,posicao,codigo,descricao,quantidade,valor_unitario,valor_total,referencia,nf_interna,ncm,unidade,recebido,quantidade_recebida,data_kit,status,acao,avaliacao,fornecedor_nome,conferido,data_conferencia,conferente_nome,conferente_id)
 VALUES(NEW.id,n,p->>'codigo',coalesce(p->>'descricao',''),coalesce(public.laudo_numero(p->>'quantidade'),1),public.laudo_numero(p->>'vUnit'),public.laudo_numero(p->>'vProd'),p->>'referencia',p->>'nfInterna',p->>'ncm',p->>'unidade',coalesce((p->>'recebido')::boolean,false),public.laudo_numero(p->>'quantidadeRecebida'),p->>'dataKit',p->>'status',p->>'acao',p->>'avaliacaoItem',CASE WHEN left(ltrim(p->>'fabricante'),1)<>'{' THEN p->>'fabricante' END,coalesce((p->>'conferido')::boolean,false),p->>'data_conferencia',p->>'conferente',nullif(p->>'conferenteId','')::uuid)
 ON CONFLICT(laudo_id,posicao) DO UPDATE SET codigo=excluded.codigo,descricao=excluded.descricao,quantidade=excluded.quantidade,valor_unitario=excluded.valor_unitario,valor_total=excluded.valor_total,referencia=excluded.referencia,nf_interna=excluded.nf_interna,ncm=excluded.ncm,unidade=excluded.unidade,recebido=excluded.recebido,quantidade_recebida=excluded.quantidade_recebida,data_kit=excluded.data_kit,status=excluded.status,acao=excluded.acao,avaliacao=excluded.avaliacao,fornecedor_nome=excluded.fornecedor_nome,conferido=excluded.conferido,data_conferencia=excluded.data_conferencia,conferente_nome=excluded.conferente_nome,conferente_id=excluded.conferente_id RETURNING id INTO item_id;
 fornecedores:='{}'::jsonb;
 IF left(ltrim(p->>'fabricante'),1)='{' THEN fornecedores:=(p->>'fabricante')::jsonb; END IF;
 avaliados:=regexp_split_to_array(coalesce(p->>'itemAvaliado',''),'\s*,\s*'); reaproveitados:=regexp_split_to_array(coalesce(p->>'itemReaproveitado',''),'\s*,\s*');
 FOR c IN SELECT DISTINCT btrim(code) FROM (SELECT unnest(avaliados) code UNION SELECT unnest(reaproveitados) UNION SELECT jsonb_object_keys(fornecedores)) codes WHERE btrim(code)<>'' LOOP
 fornecedor:=coalesce(fornecedores->>c,CASE WHEN left(ltrim(p->>'fabricante'),1)<>'{' THEN p->>'fabricante' END);
 INSERT INTO public.laudo_item_componentes(laudo_item_id,codigo,fornecedor_nome,fornecedor_id_fnc,avaliado,reaproveitado,conferido,data_conferencia,conferente_nome,conferente_id)
 VALUES(item_id,c,fornecedor,(SELECT id_fnc FROM public.cadastros WHERE classe='fornecedor' AND lower(btrim(nome))=lower(btrim(fornecedor)) AND id_fnc IS NOT NULL ORDER BY cnpj LIMIT 1),c=ANY(avaliados),c=ANY(reaproveitados),coalesce((p->>'conferido')::boolean,false),p->>'data_conferencia',p->>'conferente',nullif(p->>'conferenteId','')::uuid)
 ON CONFLICT(laudo_item_id,codigo) DO UPDATE SET fornecedor_nome=excluded.fornecedor_nome,fornecedor_id_fnc=excluded.fornecedor_id_fnc,avaliado=excluded.avaliado,reaproveitado=excluded.reaproveitado,conferido=excluded.conferido,data_conferencia=excluded.data_conferencia,conferente_nome=excluded.conferente_nome,conferente_id=excluded.conferente_id;
 END LOOP;
 DELETE FROM public.laudo_item_componentes WHERE laudo_item_id=item_id AND NOT (codigo=ANY(avaliados) OR codigo=ANY(reaproveitados) OR fornecedores ? codigo);
 END LOOP;
 DELETE FROM public.laudo_itens WHERE laudo_id=NEW.id AND posicao>n;
 RETURN NEW;
END $$;
CREATE TRIGGER normalizar_laudo_itens AFTER INSERT OR UPDATE OF xml_dados ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.normalizar_laudo_produtos();
REVOKE ALL ON FUNCTION public.normalizar_laudo_snapshot(),public.normalizar_laudo_produtos() FROM PUBLIC,anon,authenticated;
UPDATE public.laudos SET xml_dados=xml_dados WHERE normalizado_em IS NULL;
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.salvar_laudo_relacional(p_id uuid, p_dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE antigo public.laudos; novo jsonb; produto jsonb; resultado uuid; autorizado boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
 IF jsonb_typeof(p_dados)<>'object' THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 IF p_id IS NULL THEN
 novo:=p_dados; produto:=novo->'produtos'->0;
 INSERT INTO public.laudos(cliente_nome,nf_garantia,status,responsavel_nome,responsavel_id,produto_codigo,produto_descricao,referencia,xml_dados)
 VALUES(novo->>'cliente',novo->>'nfGarantia',CASE WHEN novo->>'statusLaudo'='finalizado' THEN 'Finalizado' ELSE 'Em análise' END,novo->>'responsavel',auth.uid(),produto->>'codigo',coalesce(produto->>'descricao','Vários produtos'),nullif(btrim(produto->>'referencia'),''),novo || jsonb_build_object('responsavelId',auth.uid())) RETURNING id INTO resultado;
 ELSE
 SELECT * INTO antigo FROM public.laudos WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Laudo não encontrado'; END IF;
 autorizado:=antigo.responsavel_id=auth.uid() OR public.has_role(auth.uid(),'admin');
 IF NOT coalesce(autorizado,false) THEN
 IF (p_dados - ARRAY['produtos','conferente_fabricante'])<>'{}'::jsonb THEN RAISE EXCEPTION 'Somente responsável ou administrador pode editar o laudo'; END IF;
 IF p_dados ? 'produtos' AND (SELECT coalesce(jsonb_agg(value - ARRAY['conferido','data_conferencia','conferente','conferenteId'] ORDER BY ord),'[]') FROM jsonb_array_elements(p_dados->'produtos') WITH ORDINALITY a(value,ord)) IS DISTINCT FROM (SELECT coalesce(jsonb_agg(value - ARRAY['conferido','data_conferencia','conferente','conferenteId'] ORDER BY ord),'[]') FROM jsonb_array_elements(coalesce(antigo.xml_dados->'produtos','[]')) WITH ORDINALITY a(value,ord)) THEN RAISE EXCEPTION 'A conferência não pode alterar a análise'; END IF;
 END IF;
 novo:=coalesce(antigo.xml_dados,'{}') || p_dados; produto:=novo->'produtos'->0;
 UPDATE public.laudos SET cliente_nome=coalesce(novo->>'cliente',cliente_nome),nf_garantia=coalesce(novo->>'nfGarantia',nf_garantia),status=CASE WHEN novo->>'statusLaudo'='finalizado' THEN 'Finalizado' ELSE 'Em análise' END,responsavel_nome=coalesce(novo->>'responsavel',responsavel_nome),responsavel_id=CASE WHEN coalesce(autorizado,false) AND p_dados ? 'responsavelId' THEN coalesce(nullif(p_dados->>'responsavelId','')::uuid,responsavel_id) ELSE responsavel_id END,produto_codigo=produto->>'codigo',produto_descricao=coalesce(produto->>'descricao','Vários produtos'),referencia=nullif(btrim(produto->>'referencia'),''),xml_dados=novo WHERE id=p_id RETURNING id INTO resultado;
 END IF;
 RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.salvar_laudo_relacional(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_laudo_relacional(uuid,jsonb) TO authenticated;
CREATE VIEW public.laudos_leitura WITH (security_invoker=true) AS
SELECT l.id,l.cliente_nome,l.nf_garantia,l.status,l.responsavel_nome,l.responsavel_id,l.referencia,l.produto_descricao,l.created_at,l.updated_at,l.data_registro,l.nf_interna,l.documento_assinatura,l.pagamento,l.nota_paga,l.conferentes_fornecedores,
coalesce((SELECT jsonb_agg(jsonb_build_object('itemId',i.id,'codigo',i.codigo,'descricao',i.descricao,'quantidade',i.quantidade,'vUnit',i.valor_unitario,'vProd',i.valor_total,'referencia',i.referencia,'nfInterna',i.nf_interna,'ncm',i.ncm,'unidade',i.unidade,'recebido',i.recebido,'quantidadeRecebida',i.quantidade_recebida,'dataKit',i.data_kit,'status',i.status,'acao',i.acao,'avaliacaoItem',i.avaliacao,'fabricante',coalesce((SELECT jsonb_object_agg(c.codigo,c.fornecedor_nome)::text FROM public.laudo_item_componentes c WHERE c.laudo_item_id=i.id AND c.fornecedor_nome IS NOT NULL),i.fornecedor_nome,''),'itemAvaliado',coalesce((SELECT string_agg(c.codigo,', ' ORDER BY c.created_at,c.codigo) FROM public.laudo_item_componentes c WHERE c.laudo_item_id=i.id AND c.avaliado),''),'itemReaproveitado',coalesce((SELECT string_agg(c.codigo,', ' ORDER BY c.created_at,c.codigo) FROM public.laudo_item_componentes c WHERE c.laudo_item_id=i.id AND c.reaproveitado),''),'conferido',i.conferido,'data_conferencia',i.data_conferencia,'conferente',i.conferente_nome,'conferenteId',i.conferente_id) ORDER BY i.posicao) FROM public.laudo_itens i WHERE i.laudo_id=l.id),'[]'::jsonb) AS produtos
FROM public.laudos l;
GRANT SELECT ON public.laudos_leitura TO authenticated;
GRANT ALL ON public.laudos_leitura TO service_role;