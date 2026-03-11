create table public.componentes_kit (
  id serial not null,
  produto_kit_id character varying(30) not null,
  qtde_componente integer not null default 1,
  componente_codigo character varying(30) not null,
  referencia character varying(30) null,
  descricao character varying(200) null,
  fabricante character varying(50) null,
  localizacao character varying(20) null,
  unidade character varying(5) null default 'UN'::character varying,
  saldo integer null default 0,
  constraint componentes_kit_pkey primary key (id),
  constraint componentes_kit_produto_kit_id_fkey foreign KEY (produto_kit_id) references produtos_kit (produto_codigo)
) TABLESPACE pg_default;

create index IF not exists idx_comp_kit on public.componentes_kit using btree (produto_kit_id) TABLESPACE pg_default;