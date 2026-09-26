export type Database = {
  public: {
    Tables: {
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