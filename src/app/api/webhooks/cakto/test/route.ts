import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TestEventRequest {
  event: string;
  email?: string;
  subscriptionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestEventRequest = await request.json();
    const { event, email, subscriptionId } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const validEvents = [
      'purchase_approved',
      'subscription_created',
      'subscription_renewed',
      'subscription_renewal_refused',
      'subscription_canceled',
      'refund',
      'chargeback',
      'purchase_refused',
    ];

    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let profile = null;

    if (subscriptionId) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, plano, subscription_ends_at, subscription_status, subscription_cycle')
        .eq('subscription_id', subscriptionId)
        .single();
      profile = data;
    }

    if (!profile && email) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, plano, subscription_ends_at, subscription_status, subscription_cycle')
        .eq('email', email.toLowerCase())
        .single();
      profile = data;
    }

    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, plano, subscription_ends_at, subscription_status, subscription_cycle')
        .eq('id', user.id)
        .single();
      profile = data;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const testPayload = {
      event,
      data: {
        id: `test_${Date.now()}`,
        refId: `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'paid',
        customer: {
          name: profile.full_name || 'Test User',
          email: profile.email,
          docNumber: null,
        },
        offer: {
          id: 'test_offer',
          name: profile.subscription_cycle === 'annual' ? 'Pro Anual' : 'Pro Mensal',
          price: profile.subscription_cycle === 'annual' ? 499.00 : 49.90,
        },
        product: {
          id: 'test_product',
          name: 'VenceJa Pro',
          type: 'subscription',
        },
        subscription: {
          id: `test_sub_${Date.now()}`,
          status: profile.subscription_status || 'active',
        },
        amount: profile.subscription_cycle === 'annual' ? 499.00 : 49.90,
      },
    };

    console.log('[Webhook Test] Sending test event:', event, 'to user:', profile.email);

    return NextResponse.json({
      success: true,
      message: 'Test event sent',
      payload: testPayload,
      profile: {
        id: profile.id,
        email: profile.email,
        plano: profile.plano,
        subscription_status: profile.subscription_status,
        subscription_cycle: profile.subscription_cycle,
      },
    });

  } catch (error) {
    console.error('[Webhook Test] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint',
    usage: 'POST with { event: string, email?: string, subscriptionId?: string }',
    validEvents: [
      'purchase_approved',
      'subscription_created',
      'subscription_renewed',
      'subscription_renewal_refused',
      'subscription_canceled',
      'refund',
      'chargeback',
      'purchase_refused',
    ],
  });
}
