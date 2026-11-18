export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cadastros: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          classe: Database["public"]["Enums"]["tipo_cadastro"]
          cnpj: string
          created_at: string | null
          email: string | null
          endereco: string | null
          id_fnc: number | null
          inscricao_estadual: string | null
          nome: string
          numero: string | null
          telefone: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          classe: Database["public"]["Enums"]["tipo_cadastro"]
          cnpj: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id_fnc?: number | null
          inscricao_estadual?: string | null
          nome: string
          numero?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          classe?: Database["public"]["Enums"]["tipo_cadastro"]
          cnpj?: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id_fnc?: number | null
          inscricao_estadual?: string | null
          nome?: string
          numero?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      closed_orders: {
        Row: {
          cliente: string
          data: string
          id: string
          items: Json
          itens_count: number | null
          numero_pedido: string | null
          origem: string | null
          status: string | null
          usuario_id: string | null
          usuario_nome: string | null
          valor_total: number | null
        }
        Insert: {
          cliente: string
          data: string
          id: string
          items: Json
          itens_count?: number | null
          numero_pedido?: string | null
          origem?: string | null
          status?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente?: string
          data?: string
          id?: string
          items?: Json
          itens_count?: number | null
          numero_pedido?: string | null
          origem?: string | null
          status?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      componentes_kit: {
        Row: {
          componente_codigo: string
          descricao: string | null
          fabricante: string | null
          id: number
          localizacao: string | null
          produto_kit_id: string
          qtde_componente: number
          referencia: string | null
          saldo: number | null
          unidade: string | null
        }
        Insert: {
          componente_codigo: string
          descricao?: string | null
          fabricante?: string | null
          id?: number
          localizacao?: string | null
          produto_kit_id: string
          qtde_componente?: number
          referencia?: string | null
          saldo?: number | null
          unidade?: string | null
        }
        Update: {
          componente_codigo?: string
          descricao?: string | null
          fabricante?: string | null
          id?: number
          localizacao?: string | null
          produto_kit_id?: string
          qtde_componente?: number
          referencia?: string | null
          saldo?: number | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "componentes_kit_produto_kit_id_fkey"
            columns: ["produto_kit_id"]
            isOneToOne: false
            referencedRelation: "produtos_kit"
            referencedColumns: ["produto_codigo"]
          },
        ]
      }
      laudo_item_componentes: {
        Row: {
          avaliado: boolean
          codigo: string
          conferente_id: string | null
          conferente_nome: string | null
          conferido: boolean
          created_at: string
          data_conferencia: string | null
          fornecedor_id_fnc: number | null
          fornecedor_nome: string | null
          id: string
          laudo_item_id: string
          ordem_avaliado: number | null
          ordem_reaproveitado: number | null
          quantidade_no_kit: number | null
          reaproveitado: boolean
          updated_at: string
        }
        Insert: {
          avaliado?: boolean
          codigo: string
          conferente_id?: string | null
          conferente_nome?: string | null
          conferido?: boolean
          created_at?: string
          data_conferencia?: string | null
          fornecedor_id_fnc?: number | null
          fornecedor_nome?: string | null
          id?: string
          laudo_item_id: string
          ordem_avaliado?: number | null
          ordem_reaproveitado?: number | null
          quantidade_no_kit?: number | null
          reaproveitado?: boolean
          updated_at?: string
        }
        Update: {
          avaliado?: boolean
          codigo?: string
          conferente_id?: string | null
          conferente_nome?: string | null
          conferido?: boolean
          created_at?: string
          data_conferencia?: string | null
          fornecedor_id_fnc?: number | null
          fornecedor_nome?: string | null
          id?: string
          laudo_item_id?: string
          ordem_avaliado?: number | null
          ordem_reaproveitado?: number | null
          quantidade_no_kit?: number | null
          reaproveitado?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laudo_item_componentes_fornecedor_id_fnc_fkey"
            columns: ["fornecedor_id_fnc"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id_fnc"]
          },
          {
            foreignKeyName: "laudo_item_componentes_laudo_item_id_fkey"
            columns: ["laudo_item_id"]
            isOneToOne: false
            referencedRelation: "laudo_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      laudo_itens: {
        Row: {
          acao: string | null
          avaliacao: string | null
          codigo: string | null
          conferente_id: string | null
          conferente_nome: string | null
          conferido: boolean
          created_at: string
          data_conferencia: string | null
          data_kit: string | null
          descricao: string
          fornecedor_nome: string | null
          id: string
          laudo_id: string
          ncm: string | null
          nf_interna: string | null
          posicao: number | null
          quantidade: number | null
          quantidade_recebida: number | null
          recebido: boolean
          referencia: string | null
          status: string | null
          unidade: string | null
          updated_at: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          acao?: string | null
          avaliacao?: string | null
          codigo?: string | null
          conferente_id?: string | null
          conferente_nome?: string | null
          conferido?: boolean
          created_at?: string
          data_conferencia?: string | null
          data_kit?: string | null
          descricao: string
          fornecedor_nome?: string | null
          id?: string
          laudo_id: string
          ncm?: string | null
          nf_interna?: string | null
          posicao?: number | null
          quantidade?: number | null
          quantidade_recebida?: number | null
          recebido?: boolean
          referencia?: string | null
          status?: string | null
          unidade?: string | null
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          acao?: string | null
          avaliacao?: string | null
          codigo?: string | null
          conferente_id?: string | null
          conferente_nome?: string | null
          conferido?: boolean
          created_at?: string
          data_conferencia?: string | null
          data_kit?: string | null
          descricao?: string
          fornecedor_nome?: string | null
          id?: string
          laudo_id?: string
          ncm?: string | null
          nf_interna?: string | null
          posicao?: number | null
          quantidade?: number | null
          quantidade_recebida?: number | null
          recebido?: boolean
          referencia?: string | null
          status?: string | null
          unidade?: string | null
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "laudo_itens_laudo_id_fkey"
            columns: ["laudo_id"]
            isOneToOne: false
            referencedRelation: "laudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laudo_itens_laudo_id_fkey"
            columns: ["laudo_id"]
            isOneToOne: false
            referencedRelation: "laudos_leitura"
            referencedColumns: ["id"]
          },
        ]
      }
      laudos: {
        Row: {
          acao_tomada: string | null
          causa_raiz: string | null
          cliente_cidade: string | null
          cliente_cnpj: string | null
          cliente_endereco: string | null
          cliente_estado: string | null
          cliente_nome: string
          conferentes_fornecedores: Json
          created_at: string
          data_emissao_garantia: string | null
          data_registro: string | null
          descricao_defeito: string | null
          documento_assinatura: string | null
          id: string
          nf_garantia: string
          nf_interna: string | null
          nf_venda_data: string | null
          nf_venda_numero: string | null
          normalizado_em: string | null
          nota_paga: string | null
          observacoes: string | null
          pagamento: string | null
          problema_relatado: string | null
          produto_codigo: string | null
          produto_descricao: string
          produto_quantidade: number | null
          produto_valor_total: number | null
          produto_valor_unitario: number | null
          referencia: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          updated_at: string
          xml_dados: Json | null
          xml_importado: boolean | null
        }
        Insert: {
          acao_tomada?: string | null
          causa_raiz?: string | null
          cliente_cidade?: string | null
          cliente_cnpj?: string | null
          cliente_endereco?: string | null
          cliente_estado?: string | null
          cliente_nome: string
          conferentes_fornecedores?: Json
          created_at?: string
          data_emissao_garantia?: string | null
          data_registro?: string | null
          descricao_defeito?: string | null
          documento_assinatura?: string | null
          id?: string
          nf_garantia: string
          nf_interna?: string | null
          nf_venda_data?: string | null
          nf_venda_numero?: string | null
          normalizado_em?: string | null
          nota_paga?: string | null
          observacoes?: string | null
          pagamento?: string | null
          problema_relatado?: string | null
          produto_codigo?: string | null
          produto_descricao: string
          produto_quantidade?: number | null
          produto_valor_total?: number | null
          produto_valor_unitario?: number | null
          referencia?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          updated_at?: string
          xml_dados?: Json | null
          xml_importado?: boolean | null
        }
        Update: {
          acao_tomada?: string | null
          causa_raiz?: string | null
          cliente_cidade?: string | null
          cliente_cnpj?: string | null
          cliente_endereco?: string | null
          cliente_estado?: string | null
          cliente_nome?: string
          conferentes_fornecedores?: Json
          created_at?: string
          data_emissao_garantia?: string | null
          data_registro?: string | null
          descricao_defeito?: string | null
          documento_assinatura?: string | null
          id?: string
          nf_garantia?: string
          nf_interna?: string | null
          nf_venda_data?: string | null
          nf_venda_numero?: string | null
          normalizado_em?: string | null
          nota_paga?: string | null
          observacoes?: string | null
          pagamento?: string | null
          problema_relatado?: string | null
          produto_codigo?: string | null
          produto_descricao?: string
          produto_quantidade?: number | null
          produto_valor_total?: number | null
          produto_valor_unitario?: number | null
          referencia?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          updated_at?: string
          xml_dados?: Json | null
          xml_importado?: boolean | null
        }
        Relationships: []
      }
      ordens_producao: {
        Row: {
          cliente: string | null
          data_emissao: string
          data_ordem: string
          empresa: string | null
          id_analise: number | null
          numero_ordem: number
          usuario: string | null
        }
        Insert: {
          cliente?: string | null
          data_emissao: string
          data_ordem: string
          empresa?: string | null
          id_analise?: number | null
          numero_ordem: number
          usuario?: string | null
        }
        Update: {
          cliente?: string | null
          data_emissao?: string
          data_ordem?: string
          empresa?: string | null
          id_analise?: number | null
          numero_ordem?: number
          usuario?: string | null
        }
        Relationships: []
      }
      pending_imports: {
        Row: {
          data_recebimento: string | null
          id: string
          itens: Json | null
          message: string | null
          name: string | null
          numero_pedido: string | null
          origem: string | null
          phone: string | null
          preview: string | null
          processado: boolean | null
          texto_original: string
        }
        Insert: {
          data_recebimento?: string | null
          id?: string
          itens?: Json | null
          message?: string | null
          name?: string | null
          numero_pedido?: string | null
          origem?: string | null
          phone?: string | null
          preview?: string | null
          processado?: boolean | null
          texto_original: string
        }
        Update: {
          data_recebimento?: string | null
          id?: string
          itens?: Json | null
          message?: string | null
          name?: string | null
          numero_pedido?: string | null
          origem?: string | null
          phone?: string | null
          preview?: string | null
          processado?: boolean | null
          texto_original?: string
        }
        Relationships: []
      }
      produtos_kit: {
        Row: {
          descricao: string | null
          numero_ordem: number
          produto_codigo: string
          qtde: number
          referencia: string | null
        }
        Insert: {
          descricao?: string | null
          numero_ordem: number
          produto_codigo: string
          qtde?: number
          referencia?: string | null
        }
        Update: {
          descricao?: string | null
          numero_ordem?: number
          produto_codigo?: string
          qtde?: number
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_kit_numero_ordem_fkey"
            columns: ["numero_ordem"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["numero_ordem"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          empresa: string | null
          id: string
          nome: string
          sig_departamento: string | null
          sig_empresa: string | null
          sig_telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          nome: string
          sig_departamento?: string | null
          sig_empresa?: string | null
          sig_telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          nome?: string
          sig_departamento?: string | null
          sig_empresa?: string | null
          sig_telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regras_clientes_categorias: {
        Row: {
          atualizado_em: string | null
          categoria_nome: string | null
          id: string
          identificador: string
          percentual_desconto: number
        }
        Insert: {
          atualizado_em?: string | null
          categoria_nome?: string | null
          id?: string
          identificador: string
          percentual_desconto: number
        }
        Update: {
          atualizado_em?: string | null
          categoria_nome?: string | null
          id?: string
          identificador?: string
          percentual_desconto?: number
        }
        Relationships: []
      }
      regras_ofertas_lotes: {
        Row: {
          aplicacoes: string | null
          atualizado_em: string | null
          cliente: string | null
          codigo: string
          descricao: string | null
          id: string
          preco_lote: number | null
          preco_oferta: number | null
          qtd_minima_lote: number | null
        }
        Insert: {
          aplicacoes?: string | null
          atualizado_em?: string | null
          cliente?: string | null
          codigo: string
          descricao?: string | null
          id?: string
          preco_lote?: number | null
          preco_oferta?: number | null
          qtd_minima_lote?: number | null
        }
        Update: {
          aplicacoes?: string | null
          atualizado_em?: string | null
          cliente?: string | null
          codigo?: string
          descricao?: string | null
          id?: string
          preco_lote?: number | null
          preco_oferta?: number | null
          qtd_minima_lote?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      laudos_leitura: {
        Row: {
          cliente_nome: string | null
          conferentes_fornecedores: Json | null
          created_at: string | null
          data_registro: string | null
          documento_assinatura: string | null
          id: string | null
          nf_garantia: string | null
          nf_interna: string | null
          nota_paga: string | null
          pagamento: string | null
          produto_descricao: string | null
          produtos: Json | null
          referencia: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_nome?: string | null
          conferentes_fornecedores?: Json | null
          created_at?: string | null
          data_registro?: string | null
          documento_assinatura?: string | null
          id?: string | null
          nf_garantia?: string | null
          nf_interna?: string | null
          nota_paga?: string | null
          pagamento?: string | null
          produto_descricao?: string | null
          produtos?: never
          referencia?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_nome?: string | null
          conferentes_fornecedores?: Json | null
          created_at?: string | null
          data_registro?: string | null
          documento_assinatura?: string | null
          id?: string | null
          nf_garantia?: string | null
          nf_interna?: string | null
          nota_paga?: string | null
          pagamento?: string | null
          produto_descricao?: string | null
          produtos?: never
          referencia?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_geral: {
        Args: { termo: string }
        Returns: {
          id: number
          origem: string
          resultado: string
        }[]
      }
      delete_user_by_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      laudo_numero: { Args: { v: string }; Returns: number }
      salvar_laudo_relacional: {
        Args: { p_dados: Json; p_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "analista"
      tipo_cadastro: "cliente" | "fornecedor" | "transportadora"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "analista"],
      tipo_cadastro: ["cliente", "fornecedor", "transportadora"],
    },
  },
} as const
