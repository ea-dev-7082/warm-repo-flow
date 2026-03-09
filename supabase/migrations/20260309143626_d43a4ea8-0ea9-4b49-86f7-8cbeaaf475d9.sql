
-- =============================================
-- 1. ENUM: Roles do sistema
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'analista');

-- =============================================
-- 2. TABELA: Perfis de usuário
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  empresa TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis para usuários autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário pode criar seu próprio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 3. TABELA: Roles dos usuários
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuários podem ver suas próprias roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. TABELA: Laudos técnicos (análises de garantia)
-- =============================================
CREATE TABLE public.laudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nf_garantia TEXT NOT NULL,
  data_emissao_garantia DATE,
  cliente_nome TEXT NOT NULL,
  cliente_cnpj TEXT,
  cliente_endereco TEXT,
  cliente_cidade TEXT,
  cliente_estado TEXT,
  produto_codigo TEXT,
  produto_descricao TEXT NOT NULL,
  produto_quantidade INTEGER DEFAULT 1,
  produto_valor_unitario NUMERIC(10,2),
  produto_valor_total NUMERIC(10,2),
  nf_venda_numero TEXT,
  nf_venda_data DATE,
  status TEXT NOT NULL DEFAULT 'Em análise',
  problema_relatado TEXT,
  causa_raiz TEXT,
  descricao_defeito TEXT,
  acao_tomada TEXT,
  responsavel_id UUID REFERENCES auth.users(id),
  responsavel_nome TEXT,
  xml_importado BOOLEAN DEFAULT false,
  xml_dados JSONB,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Laudos visíveis para todos autenticados" ON public.laudos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar laudos" ON public.laudos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = responsavel_id);

CREATE POLICY "Criador ou admin pode editar laudo" ON public.laudos
  FOR UPDATE TO authenticated
  USING (auth.uid() = responsavel_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Somente admin pode deletar laudo" ON public.laudos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. TABELA: Itens adicionais do laudo
-- =============================================
CREATE TABLE public.laudo_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  laudo_id UUID NOT NULL REFERENCES public.laudos(id) ON DELETE CASCADE,
  codigo TEXT,
  descricao TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  valor_unitario NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.laudo_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itens visíveis para todos autenticados" ON public.laudo_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem inserir itens" ON public.laudo_itens
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.laudos
      WHERE id = laudo_id AND auth.uid() = responsavel_id
    )
  );

CREATE POLICY "Criador do laudo ou admin pode editar itens" ON public.laudo_itens
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.laudos
      WHERE id = laudo_id AND (auth.uid() = responsavel_id OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- =============================================
-- 6. FUNÇÃO: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_laudos_updated_at
  BEFORE UPDATE ON public.laudos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. FUNÇÃO + TRIGGER: Auto-criar profile e role ao cadastrar
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, cargo, empresa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'cargo',
    NEW.raw_user_meta_data->>'empresa'
  );

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'analista');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 8. ÍNDICES para performance
-- =============================================
CREATE INDEX idx_laudos_status ON public.laudos(status);
CREATE INDEX idx_laudos_cliente ON public.laudos(cliente_nome);
CREATE INDEX idx_laudos_nf_garantia ON public.laudos(nf_garantia);
CREATE INDEX idx_laudos_created_at ON public.laudos(created_at DESC);
CREATE INDEX idx_laudos_responsavel ON public.laudos(responsavel_id);
CREATE INDEX idx_laudo_itens_laudo_id ON public.laudo_itens(laudo_id);
