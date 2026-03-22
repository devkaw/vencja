import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const notification = await request.json();

    console.log('[Notifications API] Creating notification:', notification.title, 'for user:', notification.user_id || user.id);

    const targetUserId = notification.user_id || user.id;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Notifications API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Notifications API] Created:', data);
    return NextResponse.json({ notification: data });
  } catch (error: any) {
    console.error('[Notifications API] Catch error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        return NextResponse.json({ error: 'Erro ao marcar notificações' }, { status: 500 });
      }
    } else if (notificationId) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        return NextResponse.json({ error: 'Erro ao marcar notificação' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { notificationId, deleteAll } = await request.json();

    if (deleteAll) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: 'Erro ao deletar notificações' }, { status: 500 });
      }
    } else if (notificationId) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        return NextResponse.json({ error: 'Erro ao deletar notificação' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}