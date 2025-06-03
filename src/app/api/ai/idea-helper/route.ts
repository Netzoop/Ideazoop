import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createAdminClient, createServerComponentClient } from '@/lib/supabase';
import { withAuth, createErrorResponse } from '@/lib/auth';

// Schema for validating idea helper request
const ideaHelperSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().min(1, 'Description is required'),
});

// OpenAI API configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Daily rate limit for OpenAI calls per user
const DAILY_LIMIT = parseInt(process.env.OPENAI_DAILY_LIMIT || '5', 10);

// OpenAI model to use
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * POST /api/ai/idea-helper
 * Uses OpenAI to improve idea copy and generate tags
 * Rate limited to 5 calls per day per user
 */
export const POST = withAuth(async (req: NextRequest, user, profile) => {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { title, description } = ideaHelperSchema.parse(body);
    
    // Get Supabase client
    const supabase = createAdminClient();
    
    // Check rate limit (5 calls per day per user)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('openai_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());
    
    if (countError) {
      console.error('Error checking rate limit:', countError);
      return createErrorResponse('Failed to check rate limit', 500, 'Database Error');
    }
    
    if (count !== null && count >= DAILY_LIMIT) {
      return createErrorResponse(
        `Daily limit of ${DAILY_LIMIT} AI helper calls reached. Please try again tomorrow.`,
        429,
        'Rate Limit Exceeded'
      );
    }
    
    // Build prompt for OpenAI
    const prompt = `
You are a startup mentor helping improve an idea description and generate relevant tags.

ORIGINAL IDEA TITLE: ${title}

ORIGINAL IDEA DESCRIPTION:
${description}

Please provide:
1. An improved, more compelling version of the description that better explains the value proposition and potential impact.
2. Generate up to 5 relevant SEO-friendly tags for this idea.

Return your response in JSON format with the following structure:
{
  "improvedCopy": "The improved description...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Keep the improved copy concise but compelling. Focus on clarifying the value proposition and making the idea more marketable.
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful startup mentor that improves idea descriptions and generates relevant tags." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content || '';
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Log the failed attempt
      await supabase
        .from('openai_logs')
        .insert({
          user_id: user.id,
          prompt,
          response: { error: 'Failed to parse response', raw: responseContent }
        });
      
      return createErrorResponse('Failed to parse AI response', 500, 'AI Service Error');
    }
    
    // Validate the response structure
    if (!parsedResponse.improvedCopy || !Array.isArray(parsedResponse.tags)) {
      console.error('Invalid OpenAI response structure:', parsedResponse);
      
      // Log the failed attempt
      await supabase
        .from('openai_logs')
        .insert({
          user_id: user.id,
          prompt,
          response: { error: 'Invalid response structure', raw: parsedResponse }
        });
      
      return createErrorResponse('Invalid AI response structure', 500, 'AI Service Error');
    }
    
    // Ensure tags are strings and limit to 5
    const tags = parsedResponse.tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim())
      .slice(0, 5);
    
    // Log the successful API call
    const { error: logError } = await supabase
      .from('openai_logs')
      .insert({
        user_id: user.id,
        prompt,
        response: {
          improvedCopy: parsedResponse.improvedCopy,
          tags,
          raw: responseContent
        }
      });
    
    if (logError) {
      console.error('Error logging OpenAI call:', logError);
      // Continue despite logging error
    }
    
    // Return the improved copy and tags
    return NextResponse.json({
      data: {
        improvedCopy: parsedResponse.improvedCopy,
        tags
      },
      usage: {
        daily: {
          used: (count || 0) + 1,
          limit: DAILY_LIMIT,
          remaining: DAILY_LIMIT - ((count || 0) + 1)
        }
      }
    });
  } catch (error) {
    console.error('Error in POST /api/ai/idea-helper:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid request data: ' + error.errors.map(e => e.message).join(', '),
        400,
        'Validation Error'
      );
    }
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error);
      return createErrorResponse(
        'AI service error: ' + (error.message || 'Unknown error'),
        500,
        'AI Service Error'
      );
    }
    
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
