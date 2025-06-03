import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createServerComponentClient } from '@/lib/supabase';
import { withAuth, createErrorResponse, getUserRole } from '@/lib/auth';
import { IdeaStatus } from '@/lib/database.types';

// Schema for validating idea creation
const createIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tags: z.array(z.string()).optional().default([]),
});

// Schema for validating query parameters
const listIdeasQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  offset: z.coerce.number().min(0).optional().default(0),
  search: z.string().optional(),
});

/**
 * GET /api/ideas
 * List ideas with filtering
 */
export const GET = withAuth(async (req: NextRequest, user, profile) => {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = {
      status: url.searchParams.get('status'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      search: url.searchParams.get('search'),
    };

    // Validate query parameters
    const { status, limit, offset, search } = listIdeasQuerySchema.parse(queryParams);

    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Start building the query
    let query = supabase.from('ideas').select('*');
    
    // Apply filters based on user role
    const userRole = await getUserRole();
    
    if (userRole !== 'admin') {
      // Regular users can only see their own ideas
      query = query.eq('owner_id', user.id);
    }
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching ideas:', error);
      return createErrorResponse('Failed to fetch ideas', 500, 'Database Error');
    }
    
    // Return ideas with pagination metadata
    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ideas:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400, 'Validation Error');
    }
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});

/**
 * POST /api/ideas
 * Create a new idea
 */
export const POST = withAuth(async (req: NextRequest, user, profile) => {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const { title, description, tags } = createIdeaSchema.parse(body);
    
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Create new idea with draft status
    const { data, error } = await supabase
      .from('ideas')
      .insert({
        owner_id: user.id,
        title,
        description,
        tags,
        status: 'draft' as IdeaStatus,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating idea:', error);
      return createErrorResponse('Failed to create idea', 500, 'Database Error');
    }
    
    // Return the created idea
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/ideas:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid idea data: ' + error.errors.map(e => e.message).join(', '),
        400,
        'Validation Error'
      );
    }
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
