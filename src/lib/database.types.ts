/**
 * This file contains TypeScript type definitions for your Supabase database.
 * 
 * IMPORTANT: This is a placeholder file. It should be regenerated using the Supabase CLI
 * whenever the database schema changes:
 * 
 * npx supabase gen types typescript --project-id <your-project-id> --schema public > src/lib/database.types.ts
 * 
 * For more information: https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: Database['public']['Enums']['user_role']
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: Database['public']['Enums']['user_role']
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['user_role']
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ideas: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string
          tags: string[] | null
          status: Database['public']['Enums']['idea_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description: string
          tags?: string[] | null
          status?: Database['public']['Enums']['idea_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string
          tags?: string[] | null
          status?: Database['public']['Enums']['idea_status']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          idea_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          idea_id: string
          type: string
          meta: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          idea_id: string
          type: string
          meta?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          idea_id?: string
          type?: string
          meta?: Json | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          }
        ]
      }
      openai_logs: {
        Row: {
          id: string
          user_id: string
          prompt: string
          response: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          response: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          response?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "openai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_counts: {
        Args: { user_id: string }
        Returns: Json
      }
      get_admin_dashboard_counts: {
        Args: Record<string, never>
        Returns: Json
      }
      create_admin_user: {
        Args: { email: string; password: string }
        Returns: string
      }
    }
    Enums: {
      user_role: "owner" | "admin"
      idea_status: "draft" | "submitted" | "approved" | "rejected"
    }
  }
}
