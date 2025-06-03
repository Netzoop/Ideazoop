import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase';
import { withResourceOwner, createErrorResponse } from '@/lib/auth';
import { IdeaStatus } from '@/lib/database.types';

// Helper to get idea owner ID from request
const getIdeaOwnerId = async (req: NextRequest): Promise<string | null> => {
  const ideaId = req.nextUrl.pathname.split('/')[3]; // Extract ID from /api/ideas/[id]/submit
  if (!ideaId) return null;
  
  const supabase = createServerComponentClient();
  const { data } = await supabase
    .from('ideas')
    .select('owner_id')
    .eq('id', ideaId)
    .single();
  
  return data?.owner_id || null;
};

/**
 * POST /api/ideas/[id]/submit
 * Submit an idea for review (change status from draft/rejected to submitted)
 */
export const POST = withResourceOwner(getIdeaOwnerId, async (req: NextRequest, user, profile) => {
  try {
    const ideaId = req.nextUrl.pathname.split('/')[3];
    if (!ideaId) {
      return createErrorResponse('Idea ID is required', 400);
    }
    
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Check if the idea exists and is in draft or rejected status
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('status, title')
      .eq('id', ideaId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching idea for submission:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Idea not found', 404, 'Not Found');
      }
      
      return createErrorResponse('Failed to fetch idea', 500, 'Database Error');
    }
    
    // Verify the idea is in a valid state for submission
    if (idea.status !== 'draft' && idea.status !== 'rejected') {
      return createErrorResponse(
        `Ideas in '${idea.status}' status cannot be submitted`,
        400,
        'Invalid Status'
      );
    }
    
    // Check if the idea has a title and content (basic validation)
    if (!idea.title || idea.title.trim().length < 3) {
      return createErrorResponse(
        'Idea must have a title of at least 3 characters before submission',
        400,
        'Validation Error'
      );
    }
    
    // Update the idea status to submitted
    const { data, error } = await supabase
      .from('ideas')
      .update({
        status: 'submitted' as IdeaStatus,
      })
      .eq('id', ideaId)
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting idea:', error);
      return createErrorResponse('Failed to submit idea', 500, 'Database Error');
    }
    
    // Return the updated idea
    return NextResponse.json({
      data,
      message: 'Idea submitted successfully and is now under review'
    });
  } catch (error) {
    console.error('Error in POST /api/ideas/[id]/submit:', error);
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
