DO $$ DECLARE v text; BEGIN SELECT pg_get_viewdef('public.laudos_leitura'::regclass,true) INTO v; v:=replace(v,$s$'itemReaproveitado', COALESCE(( SELECT string_agg(c.codigo, ', '::text ORDER BY c.ordem_avaliado, c.codigo)$s$,$s$'itemReaproveitado', COALESCE(( SELECT string_agg(c.codigo, ', '::text ORDER BY c.ordem_reaproveitado, c.codigo)$s$); EXECUTE 'CREATE OR REPLACE VIEW public.laudos_leitura WITH (security_invoker=true) AS ' || v; END $$;
REVOKE ALL ON public.laudos_leitura FROM PUBLIC,anon;
DO $$
DECLARE u uuid; outra uuid; lid uuid; iid uuid; dados jsonb; produtos jsonb; bloqueado boolean;
BEGIN
 SELECT user_id INTO u FROM public.profiles ORDER BY created_at LIMIT 1;
 IF u IS NULL THEN RAISE EXCEPTION 'Teste requer um usuário existente'; END IF;
 outra:=gen_random_uuid();
 BEGIN
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 dados:='{"cliente":"TESTE NORMALIZACAO","nfGarantia":"TESTE-TRANSACAO","statusLaudo":"aberto","data":"2026-06-19","produtos":[{"codigo":"*90193","descricao":"KIT","referencia":"92.531R","quantidade":"1","vUnit":83.95,"vProd":83.95,"recebido":true,"itemAvaliado":"B2.495, 82.752","itemReaproveitado":"R2.0306, C2.130","fabricante":"{\"82.752\":\"PRIME\",\"B2.495\":\"ELASTOMEROS\",\"C2.130\":\"NAIR\",\"R2.0306\":\"BSB\"}"}]}'::jsonb;
 lid:=public.salvar_laudo_relacional(NULL,dados);
 SELECT id INTO iid FROM public.laudo_itens WHERE laudo_id=lid;
 IF (SELECT count(*) FROM public.laudo_item_componentes WHERE laudo_item_id=iid)<>4 THEN RAISE EXCEPTION 'Teste: quantidade de componentes'; END IF;
 IF (SELECT v.produtos->0->>'itemAvaliado' FROM public.laudos_leitura v WHERE id=lid)<>'B2.495, 82.752' OR (SELECT v.produtos->0->>'itemReaproveitado' FROM public.laudos_leitura v WHERE id=lid)<>'R2.0306, C2.130' THEN RAISE EXCEPTION 'Teste: ordem'; END IF;
 SELECT v.produtos INTO produtos FROM public.laudos_leitura v WHERE id=lid;
 PERFORM public.salvar_laudo_relacional(lid,jsonb_build_object('produtos',produtos));
 IF (SELECT id FROM public.laudo_itens WHERE laudo_id=lid)<>iid THEN RAISE EXCEPTION 'Teste: identidade do item'; END IF;
 PERFORM set_config('request.jwt.claim.sub',outra::text,true);
 bloqueado:=false;
 BEGIN PERFORM public.salvar_laudo_relacional(lid,'{"cliente":"ALTERACAO NEGADA"}'); EXCEPTION WHEN raise_exception THEN bloqueado:=true; END;
 IF NOT bloqueado THEN RAISE EXCEPTION 'Teste: edição indevida permitida'; END IF;
 produtos:=jsonb_set(produtos,'{0,conferido}','true');
 PERFORM public.salvar_laudo_relacional(lid,jsonb_build_object('produtos',produtos));
 IF NOT (SELECT conferido FROM public.laudo_itens WHERE id=iid) THEN RAISE EXCEPTION 'Teste: conferência'; END IF;
 PERFORM set_config('request.jwt.claim.sub','',true);
 bloqueado:=false;
 BEGIN PERFORM public.salvar_laudo_relacional(lid,'{}'); EXCEPTION WHEN raise_exception THEN bloqueado:=true; END;
 IF NOT bloqueado THEN RAISE EXCEPTION 'Teste: acesso anônimo permitido'; END IF;
 DELETE FROM public.laudos WHERE id=lid;
 IF EXISTS(SELECT 1 FROM public.laudo_item_componentes WHERE laudo_item_id=iid) THEN RAISE EXCEPTION 'Teste: cascata'; END IF;
 RAISE EXCEPTION USING ERRCODE='Z0001', MESSAGE='testes aprovados; desfazer dados temporários';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
END $$;