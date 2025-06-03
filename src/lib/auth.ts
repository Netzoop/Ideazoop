import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createServerComponentClient, getCurrentUser } from './supabase';
import { UserRole } from './database.types';

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  message: string;
  status: number;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  error: string = 'Bad Request'
): NextResponse<ApiError> {
  return NextResponse.json(
    { error, message, status },
    { status }
  );
}

/**
 * Authentication error responses
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED: createErrorResponse(
    'You must be logged in to access this resource',
    401,
    'Unauthorized'
  ),
  FORBIDDEN: createErrorResponse(
    'You do not have permission to access this resource',
    403,
    'Forbidden'
  ),
  ADMIN_REQUIRED: createErrorResponse(
    'Admin privileges required',
    403,
    'Forbidden'
  ),
  OWNER_REQUIRED: createErrorResponse(
    'You can only modify your own resources',
    403,
    'Forbidden'
  ),
};

/**
 * Middleware to require authentication for API routes
 * @param handler The API route handler
 * @returns A handler that checks for authentication before proceeding
 */
export function withAuth<T>(
  handler: (req: NextRequest, user: any, profile: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest) => {
    const { user, profile, error } = await getCurrentUser();
    
    if (error || !user) {
      return AUTH_ERRORS.UNAUTHORIZED;
    }
    
    return handler(req, user, profile);
  };
}

/**
 * Middleware to require admin role for API routes
 * @param handler The API route handler
 * @returns A handler that checks for admin role before proceeding
 */
export function withAdmin<T>(
  handler: (req: NextRequest, user: any, profile: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest) => {
    const { user, profile, error } = await getCurrentUser();
    
    if (error || !user) {
      return AUTH_ERRORS.UNAUTHORIZED;
    }
    
    if (!profile || profile.role !== 'admin') {
      return AUTH_ERRORS.ADMIN_REQUIRED;
    }
    
    return handler(req, user, profile);
  };
}

/**
 * Checks if the current user is the owner of a resource
 * @param ownerId The ID of the resource owner
 * @returns Boolean indicating if current user is the owner
 */
export async function isResourceOwner(ownerId: string): Promise<boolean> {
  const { user } = await getCurrentUser();
  return !!user && user.id === ownerId;
}

/**
 * Middleware to require resource ownership for API routes
 * @param getOwnerId Function to extract owner ID from the request
 * @param handler The API route handler
 * @returns A handler that checks for resource ownership before proceeding
 */
export function withResourceOwner<T>(
  getOwnerId: (req: NextRequest) => Promise<string | null>,
  handler: (req: NextRequest, user: any, profile: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest) => {
    const { user, profile, error } = await getCurrentUser();
    
    if (error || !user) {
      return AUTH_ERRORS.UNAUTHORIZED;
    }
    
    const ownerId = await getOwnerId(req);
    
    if (!ownerId || (ownerId !== user.id && profile?.role !== 'admin')) {
      return AUTH_ERRORS.OWNER_REQUIRED;
    }
    
    return handler(req, user, profile);
  };
}

/**
 * Check if user has a specific role
 * @param role The role to check for
 * @returns Boolean indicating if user has the role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const { profile } = await getCurrentUser();
  return !!profile && profile.role === role;
}

/**
 * Get user ID from the session
 * @returns User ID or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const { user } = await getCurrentUser();
  return user?.id || null;
}

/**
 * Validate if the current user can modify an idea based on its status and user role
 * @param ideaId The ID of the idea to check
 * @returns Object with canModify boolean and error message if applicable
 */
export async function canModifyIdea(ideaId: string): Promise<{ canModify: boolean; error?: string }> {
  const { user, profile } = await getCurrentUser();
  
  if (!user) {
    return { canModify: false, error: 'Authentication required' };
  }
  
  const supabase = createAdminClient();
  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single();
  
  if (error || !idea) {
    return { canModify: false, error: 'Idea not found' };
  }
  
  // Admins can modify submitted ideas (status only)
  if (profile?.role === 'admin' && idea.status === 'submitted') {
    return { canModify: true };
  }
  
  // Owners can modify their own ideas if in draft or rejected status
  if (idea.owner_id === user.id && (idea.status === 'draft' || idea.status === 'rejected')) {
    return { canModify: true };
  }
  
  return { 
    canModify: false, 
    error: idea.owner_id !== user.id 
      ? 'You can only modify your own ideas' 
      : 'Ideas cannot be modified in their current status'
  };
}

/**
 * Get the current user's role
 * @returns The user's role or null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
  const { profile } = await getCurrentUser();
  return profile?.role || null;
}

/**
 * Refresh the session cookies from the request
 * This is useful for API routes that need to ensure the session is fresh
 */
export async function refreshSession(): Promise<void> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient();
  await supabase.auth.getSession();
}

/**
 * Check if the current user can access admin features
 * @returns Object with canAccess boolean and error message if applicable
 */
export async function canAccessAdminFeatures(): Promise<{ canAccess: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  
  if (!profile) {
    return { canAccess: false, error: 'Authentication required' };
  }
  
  if (profile.role !== 'admin') {
    return { canAccess: false, error: 'Admin privileges required' };
  }
  
  return { canAccess: true };
}
