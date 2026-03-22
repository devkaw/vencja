import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ exists: false });
    }

    const { title } = await request.json();

    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', title)
      .limit(1);

    return NextResponse.json({ exists: data && data.length > 0 });
  } catch (error) {
    console.error('[check-notification] Error:', error);
    return NextResponse.json({ exists: false });
  }
}
