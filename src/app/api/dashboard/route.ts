import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase';
import { withAuth, createErrorResponse } from '@/lib/auth';

/**
 * GET /api/dashboard
 * Fetch aggregated dashboard statistics for the current user
 * Returns different metrics based on user role (owner vs admin)
 */
export const GET = withAuth(async (req: NextRequest, user, profile) => {
  try {
    // Get Supabase client
    const supabase = createServerComponentClient();
    
    // Check if user is admin
    const isAdmin = profile?.role === 'admin';
    
    let dashboardData;
    
    if (isAdmin) {
      // Get admin dashboard counts (all ideas across the platform)
      const { data, error } = await supabase.rpc('get_admin_dashboard_counts');
      
      if (error) {
        console.error('Error fetching admin dashboard counts:', error);
        return createErrorResponse('Failed to fetch dashboard statistics', 500, 'Database Error');
      }
      
      dashboardData = data;
      
      // Get additional admin metrics
      const { data: userCount, error: userCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!userCountError) {
        dashboardData.user_count = userCount;
      }
      
      // Get recent activity (last 5 status changes)
      const { data: recentActivity, error: activityError } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          meta,
          created_at,
          idea:ideas!notifications_idea_id_fkey(
            id,
            title,
            status,
            owner:profiles!ideas_owner_id_fkey(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('type', 'status_change')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!activityError) {
        dashboardData.recent_activity = recentActivity;
      }
    } else {
      // Get user-specific dashboard counts
      const { data, error } = await supabase.rpc('get_dashboard_counts', {
        user_id: user.id,
      });
      
      if (error) {
        console.error('Error fetching user dashboard counts:', error);
        return createErrorResponse('Failed to fetch dashboard statistics', 500, 'Database Error');
      }
      
      dashboardData = data;
      
      // Get recent notifications for the user
      const { data: recentNotifications, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          read,
          created_at,
          idea:ideas!notifications_idea_id_fkey(
            id,
            title,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!notificationsError) {
        dashboardData.recent_notifications = recentNotifications;
      }
      
      // Get unread notification count
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (!countError) {
        dashboardData.unread_count = unreadCount;
      }
    }
    
    // Return dashboard data with timestamp
    return NextResponse.json({
      data: dashboardData,
      timestamp: new Date().toISOString(),
      role: profile?.role || 'unknown',
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error);
    return createErrorResponse('An unexpected error occurred', 500, 'Internal Server Error');
  }
});
