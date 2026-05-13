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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notification_log: {
        Row: {
          app_key: string
          created_at: string
          error: string | null
          event_type: string
          id: string
          idempotency_key: string
          payload: Json | null
          recipient: string
          status: string
        }
        Insert: {
          app_key: string
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          idempotency_key: string
          payload?: Json | null
          recipient: string
          status?: string
        }
        Update: {
          app_key?: string
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string
          payload?: Json | null
          recipient?: string
          status?: string
        }
        Relationships: []
      }
      app_visit_counters: {
        Row: {
          app_key: string
          updated_at: string
          visit_count: number
        }
        Insert: {
          app_key: string
          updated_at?: string
          visit_count?: number
        }
        Update: {
          app_key?: string
          updated_at?: string
          visit_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          billing_provider: Database["public"]["Enums"]["admin_billing_provider"]
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          last_access: string
          name: string
          next_billing_date: string | null
          notifications: boolean
          phone: string | null
          plan: Database["public"]["Enums"]["admin_plan_type"]
          registered_at: string
          subscription_end: string | null
          subscription_start: string | null
          subscription_status: Database["public"]["Enums"]["admin_subscription_status"]
          total_paid: number
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          billing_provider?: Database["public"]["Enums"]["admin_billing_provider"]
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          last_access?: string
          name?: string
          next_billing_date?: string | null
          notifications?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["admin_plan_type"]
          registered_at?: string
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: Database["public"]["Enums"]["admin_subscription_status"]
          total_paid?: number
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          billing_provider?: Database["public"]["Enums"]["admin_billing_provider"]
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          last_access?: string
          name?: string
          next_billing_date?: string | null
          notifications?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["admin_plan_type"]
          registered_at?: string
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: Database["public"]["Enums"]["admin_subscription_status"]
          total_paid?: number
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      user_payment_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          plan_type: Database["public"]["Enums"]["admin_plan_type"]
          reference: string
          status: string
          transaction_date: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["admin_plan_type"]
          reference?: string
          status?: string
          transaction_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["admin_plan_type"]
          reference?: string
          status?: string
          transaction_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_profile: {
        Args: {
          p_balance: number
          p_billing_provider: string
          p_email: string
          p_name: string
          p_notifications: boolean
          p_phone: string
          p_plan: string
          p_subscription_end: string
          p_subscription_status: string
          p_total_paid: number
          p_user_id: string
          p_whatsapp: string
        }
        Returns: Json
      }
      current_admin_profile_id: { Args: never; Returns: string }
      delete_user: { Args: { p_user_id: string }; Returns: Json }
      get_all_users_for_admin: { Args: never; Returns: Json }
      get_app_visit_count: { Args: { p_app_key: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_app_visit: { Args: { p_app_key: string }; Returns: number }
      remove_user: { Args: { p_user_id: string }; Returns: Json }
      update_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      admin_billing_provider: "mock" | "stripe" | "apple" | "googleplay"
      admin_plan_type:
        | "free"
        | "trial"
        | "premium"
        | "pro"
        | "monthly"
        | "yearly"
        | "premium_monthly"
        | "premium_yearly"
      admin_subscription_status:
        | "active"
        | "inactive"
        | "trialing"
        | "in_trial"
        | "canceled"
        | "cancelled"
        | "expired"
      app_role: "admin" | "user_pro" | "user"
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
      admin_billing_provider: ["mock", "stripe", "apple", "googleplay"],
      admin_plan_type: [
        "free",
        "trial",
        "premium",
        "pro",
        "monthly",
        "yearly",
        "premium_monthly",
        "premium_yearly",
      ],
      admin_subscription_status: [
        "active",
        "inactive",
        "trialing",
        "in_trial",
        "canceled",
        "cancelled",
        "expired",
      ],
      app_role: ["admin", "user_pro", "user"],
    },
  },
} as const
