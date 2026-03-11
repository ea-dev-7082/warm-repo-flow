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
      laudo_itens: {
        Row: {
          codigo: string | null
          created_at: string
          descricao: string
          id: string
          laudo_id: string
          quantidade: number | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          descricao: string
          id?: string
          laudo_id: string
          quantidade?: number | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          descricao?: string
          id?: string
          laudo_id?: string
          quantidade?: number | null
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
          created_at: string
          data_emissao_garantia: string | null
          descricao_defeito: string | null
          id: string
          nf_garantia: string
          nf_venda_data: string | null
          nf_venda_numero: string | null
          observacoes: string | null
          problema_relatado: string | null
          produto_codigo: string | null
          produto_descricao: string
          produto_quantidade: number | null
          produto_valor_total: number | null
          produto_valor_unitario: number | null
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
          created_at?: string
          data_emissao_garantia?: string | null
          descricao_defeito?: string | null
          id?: string
          nf_garantia: string
          nf_venda_data?: string | null
          nf_venda_numero?: string | null
          observacoes?: string | null
          problema_relatado?: string | null
          produto_codigo?: string | null
          produto_descricao: string
          produto_quantidade?: number | null
          produto_valor_total?: number | null
          produto_valor_unitario?: number | null
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
          created_at?: string
          data_emissao_garantia?: string | null
          descricao_defeito?: string | null
          id?: string
          nf_garantia?: string
          nf_venda_data?: string | null
          nf_venda_numero?: string | null
          observacoes?: string | null
          problema_relatado?: string | null
          produto_codigo?: string | null
          produto_descricao?: string
          produto_quantidade?: number | null
          produto_valor_total?: number | null
          produto_valor_unitario?: number | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          updated_at?: string
          xml_dados?: Json | null
          xml_importado?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          empresa: string | null
          id: string
          nome: string
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
          updated_at?: string
          user_id?: string
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
      produtos_kit: {
        Row: {
          id: string
          produto_codigo: string
          numero_ordemservico: string | null
          descricao: string | null
          referencia: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          produto_codigo: string
          numero_ordemservico?: string | null
          descricao?: string | null
          referencia?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          produto_codigo?: string
          numero_ordemservico?: string | null
          descricao?: string | null
          referencia?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      componentes_kit: {
        Row: {
          id: string
          produto_kit_id: string | null
          qtd: string | null
          componente_id: string | null
          referencia: string | null
          componente: string | null
          fabricante: string | null
          localizacao: string | null
          unidade: string | null
          saldo: string | null
        }
        Insert: {
          id?: string
          produto_kit_id?: string | null
          qtd?: string | null
          componente_id?: string | null
          referencia?: string | null
          componente?: string | null
          fabricante?: string | null
          localizacao?: string | null
          unidade?: string | null
          saldo?: string | null
        }
        Update: {
          id?: string
          produto_kit_id?: string | null
          qtd?: string | null
          componente_id?: string | null
          referencia?: string | null
          componente?: string | null
          fabricante?: string | null
          localizacao?: string | null
          unidade?: string | null
          saldo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analista"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
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
    },
  },
} as const
