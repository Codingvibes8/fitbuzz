import type { SubscriptionTier } from "@/lib/types/subscription";

export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          user_id: string;
          tier: SubscriptionTier;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
          trial_end: string | null;
          api_calls_used: number;
          api_calls_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          tier?: SubscriptionTier;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          api_calls_used?: number;
          api_calls_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          tier?: SubscriptionTier;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          api_calls_used?: number;
          api_calls_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          duration: number;
          volume: number;
          workout_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: string;
          duration: number;
          volume?: number;
          workout_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          duration?: number;
          volume?: number;
          workout_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          difficulty: string;
          duration_weeks: number;
          sessions_per_week: number;
          target_outcome: string | null;
          is_ai_generated: boolean;
          plan_template: Record<string, unknown> | null;
          status: string;
          current_week: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          difficulty: string;
          duration_weeks: number;
          sessions_per_week: number;
          target_outcome?: string | null;
          is_ai_generated?: boolean;
          plan_template?: Record<string, unknown> | null;
          status?: string;
          current_week?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: string;
          difficulty?: string;
          duration_weeks?: number;
          sessions_per_week?: number;
          target_outcome?: string | null;
          is_ai_generated?: boolean;
          plan_template?: Record<string, unknown> | null;
          status?: string;
          current_week?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_sessions: {
        Row: {
          id: string;
          plan_id: string;
          week_number: number;
          session_number: number;
          title: string;
          description: string | null;
          category: string;
          duration_minutes: number;
          exercises: Record<string, unknown>[] | null;
          order_index: number;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          week_number: number;
          session_number: number;
          title: string;
          description?: string | null;
          category: string;
          duration_minutes: number;
          exercises?: Record<string, unknown>[] | null;
          order_index?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          week_number?: number;
          session_number?: number;
          title?: string;
          description?: string | null;
          category?: string;
          duration_minutes?: number;
          exercises?: Record<string, unknown>[] | null;
          order_index?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      calculate_plan_progress: {
        Args: { plan_id_param: string };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};