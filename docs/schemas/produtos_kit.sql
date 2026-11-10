create table public.produtos_kit (
  produto_codigo character varying(30) not null,
  numero_ordem integer not null,
  qtde integer not null default 1,
  referencia character varying(30) null,
  descricao character varying(200) null,
  constraint produtos_kit_pkey primary key (produto_codigo),
  constraint produtos_kit_numero_ordem_fkey foreign KEY (numero_ordem) references ordens_producao (numero_ordem)
) TABLESPACE pg_default;