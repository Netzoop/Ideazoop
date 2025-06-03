import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

// Types for our database tables
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Idea = Database['public']['Tables']['ideas']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type OpenAILog = Database['public']['Tables']['openai_logs']['Row'];

// Enum types from the database
export type UserRole = 'owner' | 'admin';
export type IdeaStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client for the browser
export const createBrowserClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Create a Supabase client for server components
export const createServerComponentClient = () => {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// Create a Supabase admin client with service role for server operations
export const createAdminClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper function to get the current user with profile data
export const getCurrentUser = async () => {
  const supabase = createServerComponentClient();
  
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return { user: null, profile: null, error: sessionError };
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (profileError) {
    return { user: session.user, profile: null, error: profileError };
  }
  
  return { user: session.user, profile, error: null };
};

// Helper function to check if user is an admin
export const isAdmin = async () => {
  const { profile } = await getCurrentUser();
  return profile?.role === 'admin';
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { user } = await getCurrentUser();
  return !!user;
};

// Database interface for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ideas: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          tags: string[] | null;
          status: IdeaStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description: string;
          tags?: string[] | null;
          status?: IdeaStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string;
          tags?: string[] | null;
          status?: IdeaStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          idea_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          idea_id: string;
          type: string;
          meta: any | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea_id: string;
          type: string;
          meta?: any | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea_id?: string;
          type?: string;
          meta?: any | null;
          read?: boolean;
          created_at?: string;
        };
      };
      openai_logs: {
        Row: {
          id: string;
          user_id: string;
          prompt: string;
          response: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt: string;
          response: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt?: string;
          response?: any;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_counts: {
        Args: { user_id: string };
        Returns: {
          draft_count: number;
          submitted_count: number;
          approved_count: number;
          rejected_count: number;
          total_count: number;
        };
      };
      get_admin_dashboard_counts: {
        Args: Record<string, never>;
        Returns: {
          draft_count: number;
          submitted_count: number;
          approved_count: number;
          rejected_count: number;
          total_count: number;
          pending_review_count: number;
        };
      };
      create_admin_user: {
        Args: { email: string; password: string };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      idea_status: IdeaStatus;
    };
  };
}
