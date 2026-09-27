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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};