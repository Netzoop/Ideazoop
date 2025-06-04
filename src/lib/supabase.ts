import { createClient } from '@supabase/supabase-js';
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

// Create a Supabase admin client with service role for server operations
export const createAdminClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Server-side helpers with dynamic imports to avoid build errors
let serverComponentClientCache: ReturnType<typeof createClient> | null = null;

export async function createServerComponentClient() {
  // Use dynamic import to avoid build errors with next/headers
  if (typeof window === 'undefined') {
    // Server-side
    if (!serverComponentClientCache) {
      const { createServerClient } = await import('@supabase/ssr');
      const { cookies } = await import('next/headers');
      
      const cookieStore = cookies();
      
      serverComponentClientCache = createServerClient<Database>(
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
    }
    return serverComponentClientCache;
  }
  
  // Fall back to browser client if running on client side
  return createBrowserClient();
}

// Helper function to get the current user with profile data
export async function getCurrentUser() {
  const supabase = await createServerComponentClient();
  
  try {
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
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { user: null, profile: null, error };
  }
}

// Helper function to check if user is an admin
export async function isAdmin() {
  const { profile } = await getCurrentUser();
  return profile?.role === 'admin';
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const { user } = await getCurrentUser();
  return !!user;
}
