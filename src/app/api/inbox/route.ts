import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerComponentClient } from '@/lib/supabase';
import { withAuth, createErrorResponse } from '@/lib/auth';

// Schema for validating query parameters
const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  read: z.enum(['true', 'false', 'all']).optional().default('all'),
  sort: z.enum(['created_at', 'read']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Schema for validating mark as read request
const markAsReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one notification ID is required'),
  read: z.boolean().default(true),
});

/**
 * GET /api/inbox
 * List notifications for the current user with filtering
 */
export const GET = withAuth(async (req: NextRequest, user, profile) => {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      read: url.searchParams.get('read'),
      sort: url.searchParams.get('sort'),
      order: url.searchParams.get('order'),
    };

    // Validate query parameters
    const { limit, offset, read, sort, order } = listNotificationsQuerySchema.parse(queryParams);

    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Start building the query
    let query = supabase.from('notifications')
      .select(`
        *,
        idea:ideas!notifications_idea_id_fkey(
          id,
          title,
          status
        )
      `)
      .eq('user_id', user.id);
    
    // Apply read filter if provided
    if (read !== 'all') {
      query = query.eq('read', read === 'true');
    }
    
    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return createErrorResponse('Failed to fetch notifications', 500, 'Database Error');
    }
    
    // Get unread count for badge display
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    if (countError) {
      console.error('Error counting unread notifications:', countError);
      // Continue despite count error
    }
    
    // Return notifications with pagination metadata and unread count
    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
      unread: unreadCount || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/inbox:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400, 'Validation Error');
    }
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});

/**
 * PATCH /api/inbox
 * Mark notifications as read or unread
 */
export const PATCH = withAuth(async (req: NextRequest, user, profile) => {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { ids, read } = markAsReadSchema.parse(body);
    
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Update the notifications
    const { data, error } = await supabase
      .from('notifications')
      .update({ read })
      .in('id', ids)
      .eq('user_id', user.id) // Ensure user can only update their own notifications
      .select();
    
    if (error) {
      console.error('Error updating notifications:', error);
      return createErrorResponse('Failed to update notifications', 500, 'Database Error');
    }
    
    // Return the updated notifications
    return NextResponse.json({
      data,
      message: `${data.length} notification(s) marked as ${read ? 'read' : 'unread'}`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/inbox:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid request data: ' + error.errors.map(e => e.message).join(', '),
        400,
        'Validation Error'
      );
    }
    
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
