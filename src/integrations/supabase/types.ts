export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      asn_info: {
        Row: {
          asn_number: number
          country: string | null
          created_at: string
          id: string
          organization: string | null
          updated_at: string
        }
        Insert: {
          asn_number: number
          country?: string | null
          created_at?: string
          id?: string
          organization?: string | null
          updated_at?: string
        }
        Update: {
          asn_number?: number
          country?: string | null
          created_at?: string
          id?: string
          organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cidr_ranges: {
        Row: {
          asn_id: string
          cidr_range: unknown
          created_at: string
          id: string
          ip_count: number | null
        }
        Insert: {
          asn_id: string
          cidr_range: unknown
          created_at?: string
          id?: string
          ip_count?: number | null
        }
        Update: {
          asn_id?: string
          cidr_range?: unknown
          created_at?: string
          id?: string
          ip_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cidr_ranges_asn_id_fkey"
            columns: ["asn_id"]
            isOneToOne: false
            referencedRelation: "asn_info"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_ips: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          job_id: string
          port_scan_data: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          job_id: string
          port_scan_data?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          job_id?: string
          port_scan_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_ips_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "tracking_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      resolved_domains: {
        Row: {
          created_at: string
          domain_name: string
          domain_type: string | null
          id: string
          ip_address: unknown
          job_id: string
        }
        Insert: {
          created_at?: string
          domain_name: string
          domain_type?: string | null
          id?: string
          ip_address: unknown
          job_id: string
        }
        Update: {
          created_at?: string
          domain_name?: string
          domain_type?: string | null
          id?: string
          ip_address?: unknown
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolved_domains_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "tracking_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_jobs: {
        Row: {
          asn_number: number
          created_at: string
          current_step: number | null
          error_message: string | null
          id: string
          progress_data: Json | null
          status: string
          total_steps: number | null
          updated_at: string
        }
        Insert: {
          asn_number: number
          created_at?: string
          current_step?: number | null
          error_message?: string | null
          id?: string
          progress_data?: Json | null
          status?: string
          total_steps?: number | null
          updated_at?: string
        }
        Update: {
          asn_number?: number
          created_at?: string
          current_step?: number | null
          error_message?: string | null
          id?: string
          progress_data?: Json | null
          status?: string
          total_steps?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
