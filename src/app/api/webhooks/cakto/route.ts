import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendPaymentConfirmedEmail,
  sendPaymentRejectedEmail,
  sendSubscriptionCanceledEmail,
  sendRefundEmail,
  sendRenewalConfirmedEmail,
} from '@/lib/email/payment-notifications';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CaktoWebhookPayload {
  secret?: string;
  event: string;
  data?: {
    id: string;
    refId: string;
    status: string;
    customer: {
      name: string;
      email: string;
      docNumber?: string;
    };
    offer?: {
      id: string;
      name: string;
      price: number;
    };
    product?: {
      id: string;
      name: string;
      type: string;
    };
    subscription?: {
      id: string;
      status: string;
    };
    amount?: number;
  };
  order?: {
    id: string;
    refId: string;
    status: string;
    type: string;
    amount: string;
    product: {
      id: string;
      name: string;
    };
    offer: {
      id: string;
      name: string;
      price: number;
    };
    subscription?: string;
    customer: {
      name: string;
      email: string;
      docNumber?: string;
    };
  };
}

function normalizePayload(payload: CaktoWebhookPayload) {
  const data = payload.data || payload.order;
  if (!data) return null;

  let subscriptionId: string | null = null;
  if (payload.data?.subscription) {
    subscriptionId = payload.data.subscription.id;
  } else if (payload.order?.subscription) {
    subscriptionId = payload.order.subscription;
  }

  return {
    id: data.id,
    refId: data.refId,
    customer: {
      name: data.customer?.name || '',
      email: data.customer?.email || '',
    },
    offer: data.offer || null,
    subscription: subscriptionId,
    amount: data.amount || (payload.order as { amount?: string }) ? Number((payload.order as { amount?: string }).amount) : 0,
  };
}

function verifyWebhookSecret(payloadSecret: string | undefined): boolean {
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[Cakto Webhook] CAKTO_WEBHOOK_SECRET not configured - skipping verification');
    return true;
  }
  if (!payloadSecret) {
    console.error('[Cakto Webhook] No secret in payload');
    return false;
  }
  return payloadSecret === secret;
}

function getCycleFromOffer(offerName: string): 'monthly' | 'annual' {
  const name = offerName.toLowerCase();
  if (name.includes('anual') || name.includes('year')) {
    return 'annual';
  }
  return 'monthly';
}

function getPlanValue(offerName: string): number {
  const name = offerName.toLowerCase();
  if (name.includes('anual')) {
    return 499.00;
  }
  return 49.90;
}

function getNextBillingDate(cycle: 'monthly' | 'annual'): Date {
  const date = new Date();
  if (cycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload: CaktoWebhookPayload = JSON.parse(body);
    
    if (!verifyWebhookSecret(payload.secret)) {
      console.error('[Cakto Webhook] Invalid secret');
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const { event } = payload;
    const order = normalizePayload(payload);

    console.log('[Cakto Webhook] Received event:', event, 'Order ID:', order?.id);

    if (!order?.customer?.email) {
      console.error('[Cakto Webhook] No customer email in payload');
      return NextResponse.json({ received: true });
    }

    const supabase = supabaseAdmin;
    
    const eventKey = `${order.id}_${event}`;
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_key', eventKey)
      .single();

    if (existingEvent) {
      console.log('[Cakto Webhook] Duplicate event, skipping:', eventKey);
      return NextResponse.json({ received: true });
    }

    await supabase.from('webhook_events').insert({
      event_key: eventKey,
      event_type: event,
      order_id: order.id,
      processed_at: new Date().toISOString(),
    });

    let profile = null;
    let profileError = null;

    if (order.subscription) {
      const result = await supabase
        .from('profiles')
        .select('id, email, full_name, plano, subscription_ends_at, subscription_status, subscription_cycle')
        .eq('subscription_id', order.subscription)
        .single();
      
      if (!result.error && result.data) {
        profile = result.data;
        console.log('[Cakto Webhook] Found user by subscription_id:', order.subscription);
      }
    }

    if (!profile) {
      const result = await supabase
        .from('profiles')
        .select('id, email, full_name, plano, subscription_ends_at, subscription_status, subscription_cycle')
        .eq('email', order.customer.email.toLowerCase())
        .single();
      
      if (!result.error && result.data) {
        profile = result.data;
        console.log('[Cakto Webhook] Found user by email:', order.customer.email);
      } else {
        profileError = result.error;
      }
    }

    if (profileError || !profile) {
      console.error('[Cakto Webhook] Profile not found. Email:', order.customer.email, 'Subscription:', order.subscription);
      console.error('[Cakto Webhook] Full payload:', JSON.stringify(payload, null, 2));
      return NextResponse.json({ received: true, error: 'User not found' });
    }

    const userId = profile.id;
    const customerName = order.customer.name || profile.full_name || order.customer.email.split('@')[0];

    switch (event) {
      case 'purchase_approved':
      case 'subscription_created': {
        const cycle = order?.offer ? getCycleFromOffer(order.offer.name) : 'monthly';
        const price = order?.offer?.price ? Number(order.offer.price) : getPlanValue(order?.offer?.name || '');
        const nextBillingDate = getNextBillingDate(cycle);

        await supabase.from('profiles').upsert({
          id: userId,
          plano: 'pro',
          subscription_id: order.subscription || order.id,
          subscription_status: 'active',
          subscription_cycle: cycle,
          subscription_started_at: new Date().toISOString(),
          subscription_ends_at: nextBillingDate.toISOString(),
        });

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          subscription_id: order.subscription || order.id,
          plan_type: cycle,
          status: 'active',
          price_cents: Math.round(price * 100),
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
        });

        await sendPaymentConfirmedEmail(
          order.customer.email,
          customerName,
          cycle,
          price
        );

        console.log('[Cakto Webhook] Subscription activated for user:', userId);
        break;
      }

      case 'subscription_renewed': {
        const cycle = order?.offer ? getCycleFromOffer(order.offer.name) : 'monthly';
        const price = order?.offer?.price ? Number(order.offer.price) : getPlanValue(order?.offer?.name || '');
        const nextBillingDate = getNextBillingDate(cycle);

        await supabase.from('profiles').update({
          subscription_status: 'active',
          subscription_ends_at: nextBillingDate.toISOString(),
        }).eq('id', userId);

        await supabase.from('subscriptions').update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
        }).eq('subscription_id', order.subscription || order.id);

        await sendRenewalConfirmedEmail(
          order.customer.email,
          customerName,
          cycle,
          price,
          nextBillingDate.toLocaleDateString('pt-BR')
        );

        console.log('[Cakto Webhook] Subscription renewed for user:', userId);
        break;
      }

      case 'subscription_renewal_refused': {
        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('id', userId);

        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('subscription_id', order.subscription || order.id);

        await sendPaymentRejectedEmail(
          order.customer.email,
          customerName,
          'A cobrança da sua assinatura não foi processada. Por favor, atualize seu método de pagamento.'
        );

        console.log('[Cakto Webhook] Payment refused for user:', userId);
        break;
      }

      case 'subscription_canceled': {
        const currentEndsAt = profile.subscription_ends_at;
        const currentEndDate = currentEndsAt ? new Date(currentEndsAt) : new Date();
        const endDateFormatted = currentEndDate.toLocaleDateString('pt-BR');
        
        if (currentEndDate > new Date()) {
          await supabase.from('profiles').update({
            subscription_status: 'canceled',
            cancellation_status: 'approved',
            cancellation_requested_at: null,
            cancellation_type: null,
            cancellation_reason: null,
          }).eq('id', userId);
        } else {
          await supabase.from('profiles').upsert({
            id: userId,
            plano: 'free',
            subscription_status: 'canceled',
            cancellation_status: 'approved',
            cancellation_requested_at: null,
            cancellation_type: null,
            cancellation_reason: null,
          });

          await supabase.from('subscriptions').update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          }).eq('subscription_id', order.subscription || order.id);
        }

        await sendSubscriptionCanceledEmail(
          order.customer.email,
          customerName,
          endDateFormatted
        );

        console.log('[Cakto Webhook] Subscription canceled for user:', userId);
        break;
      }

      case 'refund':
      case 'chargeback': {
        const price = order?.offer?.price ? Number(order.offer.price) : 49.90;
        
        await supabase.from('profiles').upsert({
          id: userId,
          plano: 'free',
          subscription_status: 'canceled',
          cancellation_status: 'approved',
          cancellation_requested_at: null,
          cancellation_type: null,
          cancellation_reason: null,
        });

        await supabase.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        }).eq('subscription_id', order.subscription || order.id);

        await sendRefundEmail(
          order.customer.email,
          customerName,
          price,
          event === 'chargeback' ? 'Chargeback solicitado' : 'Reembolso solicitado'
        );

        console.log('[Cakto Webhook] Refund/Chargeback for user:', userId);
        break;
      }

      case 'purchase_refused': {
        await sendPaymentRejectedEmail(
          order.customer.email,
          customerName,
          'Seu pagamento foi recusado. Por favor, tente novamente com outro método de pagamento.'
        );

        console.log('[Cakto Webhook] Purchase refused for user:', userId);
        break;
      }

      default:
        console.log('[Cakto Webhook] Unhandled event:', event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Cakto Webhook] Error:', error);
    return NextResponse.json({ received: true });
  }
}