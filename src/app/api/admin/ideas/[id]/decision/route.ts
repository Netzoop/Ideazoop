import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerComponentClient } from '@/lib/supabase';
import { withAdmin, createErrorResponse } from '@/lib/auth';
import { IdeaStatus } from '@/lib/database.types';

// Schema for validating admin decision
const decisionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    required_error: "Action must be either 'approve' or 'reject'",
  }),
  comment: z.string().min(3, {
    message: "Comment is required and must be at least 3 characters",
  }).max(1000, {
    message: "Comment must be less than 1000 characters",
  }),
});

/**
 * POST /api/admin/ideas/[id]/decision
 * Admin decision to approve or reject a submitted idea
 * Requires admin role and a mandatory comment
 */
export const POST = withAdmin(async (req: NextRequest, user, profile) => {
  try {
    // Extract idea ID from the URL
    const ideaId = req.nextUrl.pathname.split('/')[4]; // /api/admin/ideas/[id]/decision
    if (!ideaId) {
      return createErrorResponse('Idea ID is required', 400);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { action, comment } = decisionSchema.parse(body);
    
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Check if the idea exists and is in submitted status
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('status, owner_id, title')
      .eq('id', ideaId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching idea for admin decision:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Idea not found', 404, 'Not Found');
      }
      
      return createErrorResponse('Failed to fetch idea', 500, 'Database Error');
    }
    
    // Verify the idea is in submitted status
    if (idea.status !== 'submitted') {
      return createErrorResponse(
        `Only ideas in 'submitted' status can be approved or rejected`,
        400,
        'Invalid Status'
      );
    }
    
    // Determine the new status based on the action
    const newStatus: IdeaStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update the idea status
    const { data, error } = await supabase
      .from('ideas')
      .update({
        status: newStatus,
      })
      .eq('id', ideaId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating idea status:', error);
      return createErrorResponse('Failed to update idea status', 500, 'Database Error');
    }
    
    // Add the admin's comment
    const { error: commentError } = await supabase
      .from('comments')
      .insert({
        idea_id: ideaId,
        author_id: user.id,
        body: comment,
      });
    
    if (commentError) {
      console.error('Error adding admin comment:', commentError);
      // Continue despite comment error, but log it
      // We don't want to revert the status change if only the comment failed
    }
    
    // Return the updated idea with success message
    return NextResponse.json({
      data,
      message: `Idea ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      action,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/ideas/[id]/decision:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid decision data: ' + error.errors.map(e => e.message).join(', '),
        400,
        'Validation Error'
      );
    }
    
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
