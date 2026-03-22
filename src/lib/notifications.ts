import { createClient } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: 'warning' | 'danger' | 'success' | 'info' | 'plan';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createNotification(userId: string, notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || null,
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
}

export async function getNotifications(userId: string, limit = 50) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

export async function deleteNotification(notificationId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

export async function getUnreadCount(userId: string) {
  const supabase = getSupabaseAdmin();
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}