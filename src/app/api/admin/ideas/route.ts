import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerComponentClient } from '@/lib/supabase';
import { withAdmin, createErrorResponse } from '@/lib/auth';

// Schema for validating query parameters
const listIdeasQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  search: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'title']).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/admin/ideas
 * List all ideas with admin filtering capabilities
 * Only accessible by users with admin role
 */
export const GET = withAdmin(async (req: NextRequest, user, profile) => {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = {
      status: url.searchParams.get('status'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      search: url.searchParams.get('search'),
      sort: url.searchParams.get('sort'),
      order: url.searchParams.get('order'),
    };

    // Validate query parameters
    const { status, limit, offset, search, sort, order } = listIdeasQuerySchema.parse(queryParams);

    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Start building the query with extended information for admin review
    let query = supabase.from('ideas').select(`
      *,
      owner:profiles!ideas_owner_id_fkey(id, full_name, avatar_url, role),
      comments:comments(
        id,
        body,
        created_at,
        author:profiles!comments_author_id_fkey(id, full_name, avatar_url, role)
      ),
      comment_count:comments(count)
    `);
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching ideas for admin:', error);
      return createErrorResponse('Failed to fetch ideas', 500, 'Database Error');
    }
    
    // Get dashboard counts for admin view
    const { data: dashboardCounts, error: dashboardError } = await supabase.rpc(
      'get_admin_dashboard_counts'
    );
    
    if (dashboardError) {
      console.error('Error fetching dashboard counts:', dashboardError);
      // Continue with the response, just log the error
    }
    
    // Return ideas with pagination metadata and dashboard counts
    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
      dashboard: dashboardCounts || {
        draft_count: 0,
        submitted_count: 0,
        approved_count: 0,
        rejected_count: 0,
        total_count: 0,
        pending_review_count: 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/ideas:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400, 'Validation Error');
    }
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
