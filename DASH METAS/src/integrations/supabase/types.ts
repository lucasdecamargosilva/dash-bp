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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      pipeline_elam_inbound: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: never
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: never
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      pipeline_elam_outbound: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: never
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: never
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      pipeline_elam_vida_plena: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_elyano_high_one: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: number
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: number
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_elyano_high_profile: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: number
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: number
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_elyano_higher: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: number
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: number
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_goals: {
        Row: {
          client_name: string
          created_at: string
          id: string
          total_conexoes: number
          total_mensagens_enviadas: number
          total_reunioes_agendadas: number
          total_reunioes_realizadas: number
          total_whatsapp_obtido: number
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          id?: string
          total_conexoes?: number
          total_mensagens_enviadas?: number
          total_reunioes_agendadas?: number
          total_reunioes_realizadas?: number
          total_whatsapp_obtido?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          total_conexoes?: number
          total_mensagens_enviadas?: number
          total_reunioes_agendadas?: number
          total_reunioes_realizadas?: number
          total_whatsapp_obtido?: number
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_prime_elevate: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_prime_ignite: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_prime_legacy: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          em_contato: number | null
          faturamento: number | null
          fechado: number | null
          id: number
          interessado: number | null
          meta_propostas_em_analise: number | null
          meta_vendas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          em_contato?: number | null
          faturamento?: number | null
          fechado?: number | null
          id?: never
          interessado?: number | null
          meta_propostas_em_analise?: number | null
          meta_vendas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_prospec_bp_results: {
        Row: {
          cancelado: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          fechado: number | null
          fup_medio_prazo: number | null
          id: number
          interessado: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          perdido: number | null
          proposta_em_analise: number | null
          qualificado: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
        }
        Insert: {
          cancelado?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          fechado?: number | null
          fup_medio_prazo?: number | null
          id?: never
          interessado?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
        }
        Update: {
          cancelado?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          fechado?: number | null
          fup_medio_prazo?: number | null
          id?: never
          interessado?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          perdido?: number | null
          proposta_em_analise?: number | null
          qualificado?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_prospec_elam: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      pipeline_prospec_elyano: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      pipeline_prospec_marcos_rossi: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      pipeline_prospec_minoru: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      pipeline_prospec_prime: {
        Row: {
          conexao: number | null
          contato: number | null
          created_at: string
          data_atualizacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: number
          mensagem_enviada: number | null
          meta_mensagens_enviadas: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          reuniao_agendada: number | null
          reuniao_realizada: number | null
          updated_at: string
          whatsapp_obtido: number | null
        }
        Insert: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: never
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Update: {
          conexao?: number | null
          contato?: number | null
          created_at?: string
          data_atualizacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: never
          mensagem_enviada?: number | null
          meta_mensagens_enviadas?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          reuniao_agendada?: number | null
          reuniao_realizada?: number | null
          updated_at?: string
          whatsapp_obtido?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
