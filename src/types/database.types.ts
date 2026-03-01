export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "pending" | "in-progress" | "completed";
          priority: "low" | "medium" | "high";
          due_date: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: "pending" | "in-progress" | "completed";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: "pending" | "in-progress" | "completed";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          steps: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          steps?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          steps?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          notifications_enabled: boolean;
          email_notifications: boolean;
          theme: "light" | "dark" | "system";
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notifications_enabled?: boolean;
          email_notifications?: boolean;
          theme?: "light" | "dark" | "system";
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notifications_enabled?: boolean;
          email_notifications?: boolean;
          theme?: "light" | "dark" | "system";
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type WorkflowInsert =
  Database["public"]["Tables"]["workflows"]["Insert"];
export type WorkflowUpdate =
  Database["public"]["Tables"]["workflows"]["Update"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type UserSettingsUpdate =
  Database["public"]["Tables"]["user_settings"]["Update"];
