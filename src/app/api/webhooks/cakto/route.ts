import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendPaymentConfirmedEmail,
  sendPaymentRejectedEmail,
  sendSubscriptionCanceledEmail,
  sendOrderReceivedEmail,
  sendRefundEmail,
} from '@/lib/email/payment-notifications';

interface CaktoWebhookPayload {
  event: string;
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

const processedEvents = new Set<string>();

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
    const payload: CaktoWebhookPayload = await request.json();
    const { event, order } = payload;

    console.log('[Cakto Webhook] Received event:', event);

    if (!order?.customer?.email) {
      console.error('[Cakto Webhook] No customer email in payload');
      return NextResponse.json({ received: true });
    }

    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, plano, subscription_ends_at')
      .eq('email', order.customer.email.toLowerCase())
      .single();

    if (profileError || !profile) {
      console.log('[Cakto Webhook] Profile not found for email:', order.customer.email);
      return NextResponse.json({ received: true });
    }

    const eventKey = `${order.id}_${event}`;
    
    if (processedEvents.has(eventKey)) {
      console.log('[Cakto Webhook] Duplicate event, skipping:', eventKey);
      return NextResponse.json({ received: true });
    }
    processedEvents.add(eventKey);

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
          subscription_ends_at: nextBillingDate.toISOString(),
        }).eq('id', userId);

        await supabase.from('subscriptions').update({
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
        }).eq('subscription_id', order.subscription || order.id);

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
          customerName
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