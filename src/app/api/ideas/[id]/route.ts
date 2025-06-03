import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createServerComponentClient } from '@/lib/supabase';
import { withAuth, createErrorResponse, canModifyIdea, getUserId, withResourceOwner } from '@/lib/auth';

// Schema for validating idea updates
const updateIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  tags: z.array(z.string()).optional(),
});

// Helper to get idea owner ID from request
const getIdeaOwnerId = async (req: NextRequest): Promise<string | null> => {
  const ideaId = req.nextUrl.pathname.split('/').pop();
  if (!ideaId) return null;
  
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('ideas')
    .select('owner_id')
    .eq('id', ideaId)
    .single();
  
  return data?.owner_id || null;
};

/**
 * GET /api/ideas/[id]
 * Get a specific idea by ID
 */
export const GET = withAuth(async (req: NextRequest, user, profile) => {
  try {
    const ideaId = req.nextUrl.pathname.split('/').pop();
    if (!ideaId) {
      return createErrorResponse('Idea ID is required', 400);
    }
    
    const supabase = createServerComponentClient();
    
    // Get the idea with owner profile and comments
    const { data: idea, error } = await supabase
      .from('ideas')
      .select(`
        *,
        owner:profiles!ideas_owner_id_fkey(id, full_name, avatar_url),
        comments:comments(
          id,
          body,
          created_at,
          author:profiles!comments_author_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('id', ideaId)
      .single();
    
    if (error) {
      console.error('Error fetching idea:', error);
      
      if (error.code === 'PGRST116') {
        return createErrorResponse('Idea not found', 404, 'Not Found');
      }
      
      return createErrorResponse('Failed to fetch idea', 500, 'Database Error');
    }
    
    // Check if user has access to this idea
    const userId = await getUserId();
    const isOwner = idea.owner_id === userId;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return createErrorResponse('You do not have permission to view this idea', 403, 'Forbidden');
    }
    
    // Return the idea with its related data
    return NextResponse.json({ data: idea });
  } catch (error) {
    console.error('Error in GET /api/ideas/[id]:', error);
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});

/**
 * PUT /api/ideas/[id]
 * Update an idea (owner can update draft/rejected ideas only)
 */
export const PUT = withResourceOwner(getIdeaOwnerId, async (req: NextRequest, user, profile) => {
  try {
    const ideaId = req.nextUrl.pathname.split('/').pop();
    if (!ideaId) {
      return createErrorResponse('Idea ID is required', 400);
    }
    
    // Check if the user can modify this idea based on status
    const { canModify, error: modifyError } = await canModifyIdea(ideaId);
    if (!canModify) {
      return createErrorResponse(modifyError || 'Cannot modify this idea', 403, 'Forbidden');
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { title, description, tags } = updateIdeaSchema.parse(body);
    
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Update the idea
    const { data, error } = await supabase
      .from('ideas')
      .update({
        ...(title && { title }),
        ...(description && { description }),
        ...(tags && { tags }),
      })
      .eq('id', ideaId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating idea:', error);
      return createErrorResponse('Failed to update idea', 500, 'Database Error');
    }
    
    // Return the updated idea
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/ideas/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid update data: ' + error.errors.map(e => e.message).join(', '),
        400,
        'Validation Error'
      );
    }
    
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});

/**
 * DELETE /api/ideas/[id]
 * Delete an idea (owner can delete draft ideas only)
 */
export const DELETE = withResourceOwner(getIdeaOwnerId, async (req: NextRequest, user, profile) => {
  try {
    const ideaId = req.nextUrl.pathname.split('/').pop();
    if (!ideaId) {
      return createErrorResponse('Idea ID is required', 400);
    }
    
    // Get Supabase client
    const supabase = createAdminClient();
    
    // Check if the idea exists and is in draft status
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('status')
      .eq('id', ideaId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching idea for deletion:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Idea not found', 404, 'Not Found');
      }
      
      return createErrorResponse('Failed to fetch idea', 500, 'Database Error');
    }
    
    // Only draft ideas can be deleted
    if (idea.status !== 'draft') {
      return createErrorResponse(
        'Only draft ideas can be deleted',
        403,
        'Forbidden'
      );
    }
    
    // Delete the idea
    const { error: deleteError } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId);
    
    if (deleteError) {
      console.error('Error deleting idea:', deleteError);
      return createErrorResponse('Failed to delete idea', 500, 'Database Error');
    }
    
    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/ideas/[id]:', error);
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
