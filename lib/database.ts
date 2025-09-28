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
      client_freelancers: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          freelancer_id: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          freelancer_id: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          freelancer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_freelancers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_freelancers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_freelancers_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          billing_address: string | null
          billing_email: string
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          billing_email: string
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          billing_email?: string
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          contact_email: string | null
          created_at: string
          estimated_freelancers: number | null
          id: string
          invited_at: string | null
          invited_by: string | null
          name: string
          plan: string
          siret: string | null
          status: Database["public"]["Enums"]["company_status"] | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          estimated_freelancers?: number | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          name: string
          plan?: string
          siret?: string | null
          status?: Database["public"]["Enums"]["company_status"] | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          estimated_freelancers?: number | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          name?: string
          plan?: string
          siret?: string | null
          status?: Database["public"]["Enums"]["company_status"] | null
        }
        Relationships: []
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          business_sector: string | null
          company_created_id: string | null
          company_name: string
          created_at: string | null
          email: string
          estimated_freelancers: number | null
          expires_at: string | null
          id: string
          invitation_token: string
          invited_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          siret: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          business_sector?: string | null
          company_created_id?: string | null
          company_name: string
          created_at?: string | null
          email: string
          estimated_freelancers?: number | null
          expires_at?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          siret?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          business_sector?: string | null
          company_created_id?: string | null
          company_name?: string
          created_at?: string | null
          email?: string
          estimated_freelancers?: number | null
          expires_at?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          siret?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_created_id_fkey"
            columns: ["company_created_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          commission_rate: number | null
          company_id: string
          contract_file_url: string | null
          created_at: string
          currency: string | null
          end_date: string
          id: string
          payment_terms: number | null
          payment_terms_type: string | null
          start_date: string
          status: string
          tjm: number
          user_id: string
          vat_applicable: boolean | null
          vat_rate: number | null
        }
        Insert: {
          client_id: string
          commission_rate?: number | null
          company_id: string
          contract_file_url?: string | null
          created_at?: string
          currency?: string | null
          end_date: string
          id?: string
          payment_terms?: number | null
          payment_terms_type?: string | null
          start_date: string
          status?: string
          tjm: number
          user_id: string
          vat_applicable?: boolean | null
          vat_rate?: number | null
        }
        Update: {
          client_id?: string
          commission_rate?: number | null
          company_id?: string
          contract_file_url?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string
          id?: string
          payment_terms?: number | null
          payment_terms_type?: string | null
          start_date?: string
          status?: string
          tjm?: number
          user_id?: string
          vat_applicable?: boolean | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_logs: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          response: string | null
          status: number | null
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          response?: string | null
          status?: number | null
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          response?: string | null
          status?: number | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          email: string
          freelancers_count: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          freelancers_count: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          freelancers_count?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      freelancer_payments: {
        Row: {
          advance_reason: string | null
          amount: number
          company_id: string
          created_at: string
          created_by: string
          id: string
          invoice_id: string
          is_advance: boolean
          notes: string | null
          payment_date: string
          payment_method: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          advance_reason?: string | null
          amount: number
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          invoice_id: string
          is_advance?: boolean
          notes?: string | null
          payment_date?: string
          payment_method: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          advance_reason?: string | null
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          invoice_id?: string
          is_advance?: boolean
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freelancer_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      hno_configurations: {
        Row: {
          company_id: string
          created_at: string | null
          description: string
          id: string
          label: string
          majoration_percent: number
          time_range: string
          time_slot: Database["public"]["Enums"]["hno_time_slot"]
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description: string
          id?: string
          label: string
          majoration_percent: number
          time_range: string
          time_slot: Database["public"]["Enums"]["hno_time_slot"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string
          id?: string
          label?: string
          majoration_percent?: number
          time_range?: string
          time_slot?: Database["public"]["Enums"]["hno_time_slot"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hno_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          amount_cfa: number | null
          amount_ht: number | null
          amount_ttc: number | null
          client_id: string
          commission_amount: number | null
          company_id: string
          conversion_rate: number | null
          created_at: string
          due_date: string | null
          facturation_ht: number | null
          facturation_net: number | null
          facturation_ttc: number | null
          id: string
          issue_date: string
          number: string
          paid_at: string | null
          pdf_url: string | null
          status: string
          timesheet_id: string
          tjm_final: number | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          amount_cfa?: number | null
          amount_ht?: number | null
          amount_ttc?: number | null
          client_id: string
          commission_amount?: number | null
          company_id: string
          conversion_rate?: number | null
          created_at?: string
          due_date?: string | null
          facturation_ht?: number | null
          facturation_net?: number | null
          facturation_ttc?: number | null
          id?: string
          issue_date?: string
          number: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          timesheet_id: string
          tjm_final?: number | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          amount_cfa?: number | null
          amount_ht?: number | null
          amount_ttc?: number | null
          client_id?: string
          commission_amount?: number | null
          company_id?: string
          conversion_rate?: number | null
          created_at?: string
          due_date?: string | null
          facturation_ht?: number | null
          facturation_net?: number | null
          facturation_ttc?: number | null
          id?: string
          issue_date?: string
          number?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          timesheet_id?: string
          tjm_final?: number | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: true
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          freelancer_paid: Json | null
          id: string
          invoice_overdue: Json | null
          invoice_sent: Json | null
          payment_received: Json | null
          timesheet_rejected: Json | null
          timesheet_submitted: Json | null
          timesheet_validated: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          freelancer_paid?: Json | null
          id?: string
          invoice_overdue?: Json | null
          invoice_sent?: Json | null
          payment_received?: Json | null
          timesheet_rejected?: Json | null
          timesheet_submitted?: Json | null
          timesheet_validated?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          freelancer_paid?: Json | null
          id?: string
          invoice_overdue?: Json | null
          invoice_sent?: Json | null
          payment_received?: Json | null
          timesheet_rejected?: Json | null
          timesheet_submitted?: Json | null
          timesheet_validated?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_activities: {
        Row: {
          activity_type: string
          admin_id: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          activity_type: string
          admin_id: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          activity_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_activities_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_reminders: {
        Row: {
          created_at: string | null
          id: string
          last_reminder_date: string | null
          month: string
          reminder_count: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_reminder_date?: string | null
          month: string
          reminder_count?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          last_reminder_date?: string | null
          month?: string
          reminder_count?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          admin_id: string | null
          contract_id: string
          created_at: string
          id: string
          month: string
          rejected_at: string | null
          status: Database["public"]["Enums"]["timesheet_status"]
          submitted_at: string | null
          validated_at: string | null
          worked_days: number
          year: number | null
        }
        Insert: {
          admin_id?: string | null
          contract_id: string
          created_at?: string
          id?: string
          month: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          validated_at?: string | null
          worked_days: number
          year?: number | null
        }
        Update: {
          admin_id?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          month?: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          validated_at?: string | null
          worked_days?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          last_login: string | null
          phone: string | null
          role: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string
          email: string
          full_name: string
          id: string
          last_login?: string | null
          phone?: string | null
          role?: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_esn_invitation: {
        Args: { p_company_id: string; p_invitation_token: string }
        Returns: boolean
      }
      create_default_notification_preferences: {
        Args: { user_id_param: string }
        Returns: {
          created_at: string
          freelancer_paid: Json
          id: string
          invoice_overdue: Json
          invoice_sent: Json
          payment_received: Json
          timesheet_rejected: Json
          timesheet_submitted: Json
          timesheet_validated: Json
          updated_at: string
          user_id: string
        }[]
      }
      create_esn_invitation: {
        Args: {
          p_business_sector?: string
          p_company_name: string
          p_email: string
          p_estimated_freelancers?: number
          p_siret?: string
        }
        Returns: string
      }
      current_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_freelancers_for_client: {
        Args: { client_uuid: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_linked: boolean
        }[]
      }
      get_linked_clients_for_freelancer: {
        Args: { freelancer_uuid: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_notification_preferences: {
        Args: { user_id_param: string }
        Returns: {
          created_at: string
          freelancer_paid: Json
          id: string
          invoice_overdue: Json
          invoice_sent: Json
          payment_received: Json
          timesheet_rejected: Json
          timesheet_submitted: Json
          timesheet_validated: Json
          updated_at: string
          user_id: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_same_company: {
        Args: { c_id: string }
        Returns: boolean
      }
      trigger_timesheet_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_notification_preference: {
        Args: {
          channel_preferences: Json
          notification_type: string
          user_id_param: string
        }
        Returns: {
          created_at: string
          freelancer_paid: Json
          id: string
          invoice_overdue: Json
          invoice_sent: Json
          payment_received: Json
          timesheet_rejected: Json
          timesheet_submitted: Json
          timesheet_validated: Json
          updated_at: string
          user_id: string
        }[]
      }
    }
    Enums: {
      company_status: "pending" | "accepted" | "rejected"
      hno_time_slot:
        | "weekday_evening"
        | "weekday_night"
        | "saturday_day"
        | "saturday_evening"
        | "saturday_night"
        | "sunday_holiday"
      timesheet_status: "draft" | "submitted" | "approved" | "rejected"
      user_role: "admin" | "freelancer" | "super_admin"
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
      company_status: ["pending", "accepted", "rejected"],
      hno_time_slot: [
        "weekday_evening",
        "weekday_night",
        "saturday_day",
        "saturday_evening",
        "saturday_night",
        "sunday_holiday",
      ],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
      user_role: ["admin", "freelancer", "super_admin"],
    },
  },
} as const
