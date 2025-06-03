import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerComponentClient } from '@/lib/supabase';
import { withAuth, createErrorResponse } from '@/lib/auth';

// Schema for validating comment creation
const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long')
});

/**
 * POST /api/ideas/[id]/comment
 * Add a comment to an idea
 */
export const POST = withAuth(async (req: NextRequest, user, profile) => {
  try {
    const ideaId = req.nextUrl.pathname.split('/')[3]; // Extract ID from /api/ideas/[id]/comment
    if (!ideaId) {
      return createErrorResponse('Idea ID is required', 400);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { body: commentBody } = createCommentSchema.parse(body);
    
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Check if the idea exists and the user has permission to comment
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('owner_id')
      .eq('id', ideaId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching idea for commenting:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Idea not found', 404, 'Not Found');
      }
      
      return createErrorResponse('Failed to fetch idea', 500, 'Database Error');
    }
    
    // Check if user is the idea owner or an admin
    const isOwner = idea.owner_id === user.id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return createErrorResponse(
        'Only the idea owner and administrators can comment',
        403,
        'Forbidden'
      );
    }
    
    // Create the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        idea_id: ideaId,
        author_id: user.id,
        body: commentBody
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, full_name, avatar_url, role)
      `)
      .single();
    
    if (error) {
      console.error('Error creating comment:', error);
      return createErrorResponse('Failed to create comment', 500, 'Database Error');
    }
    
    // Return the created comment with author information
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/ideas/[id]/comment:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid comment data: ' + error.errors.map(e => e.message).join(', '),
        400,
        'Validation Error'
      );
    }
    
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
