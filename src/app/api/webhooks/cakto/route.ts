import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  sendPaymentConfirmedEmail,
  sendPaymentRejectedEmail,
  sendSubscriptionCanceledEmail,
  sendRefundEmail,
  sendRenewalConfirmedEmail,
} from '@/lib/email/payment-notifications';

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CaktoOrderData {
  id: string;
  refId: string;
  status: string;
  callback?: string | null;
  customer?: {
    name?: string;
    email?: string;
  };
  offer?: {
    id: string;
    name: string;
    price: number;
  } | null;
  subscription?: { id: string; status?: string } | string | null;
  amount?: number | null;
}

interface CaktoWebhookPayload {
  secret?: string;
  event: string;
  data?: CaktoOrderData | CaktoOrderData[];
  order?: CaktoOrderData;
}

function normalizePayload(payload: CaktoWebhookPayload) {
  // Webhook V2 sends data as an array of orders for the same charge; the main order comes first.
  const rawData = Array.isArray(payload.data) ? payload.data[0] : payload.data;
  const data = rawData || payload.order;
  if (!data || !data.id) return null;

  let subscriptionId: string | null = null;
  if (typeof data.subscription === 'string') {
    subscriptionId = data.subscription;
  } else if (data.subscription?.id) {
    subscriptionId = data.subscription.id;
  }

  return {
    id: String(data.id),
    customer: {
      name: data.customer?.name || '',
      email: (data.customer?.email || '').toLowerCase().trim(),
    },
    offer: data.offer || null,
    subscription: subscriptionId,
    callback: data.callback || null,
    amount: Number(data.amount) || 0,
  };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function isFromCakto(request: NextRequest, rawBody: string, payloadSecret: string | undefined): boolean {
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Cakto Webhook] CAKTO_WEBHOOK_SECRET not configured - rejecting');
    return false;
  }

  const signature = request.headers.get('x-cakto-signature');
  const timestamp = request.headers.get('x-cakto-timestamp');

  if (signature && timestamp) {
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
      return false;
    }
    const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
    return signature
      .split(',')
      .map((s) => s.trim())
      .some((s) => safeEqual(s, `v1=${expected}`));
  }

  return typeof payloadSecret === 'string' && safeEqual(payloadSecret, secret);
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

function getNextBillingDate(cycle: 'monthly' | 'annual', from: Date = new Date()): Date {
  const date = new Date(from);
  if (cycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

function assertOk(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProfileRow = {
  id: string;
  email: string;
  plano: string;
  subscription_ends_at: string | null;
  subscription_status: string | null;
  subscription_cycle: string | null;
};

const PROFILE_COLUMNS = 'id, email, plano, subscription_ends_at, subscription_status, subscription_cycle';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  let payload: CaktoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isFromCakto(request, rawBody, payload.secret)) {
    console.error('[Cakto Webhook] Invalid signature/secret');
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const { event } = payload;

  if (event === 'checkout_abandonment') {
    return NextResponse.json({ received: true });
  }

  const order = normalizePayload(payload);
  console.log('[Cakto Webhook] Received event:', event, 'Order ID:', order?.id);

  if (!order) {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseAdmin();
  const eventKey = `${order.id}_${event}`;

  // Claim the event atomically: a duplicate delivery inserts nothing and is skipped.
  const { data: claimed, error: claimError } = await supabase
    .from('webhook_events')
    .upsert(
      {
        event_key: eventKey,
        event_type: event,
        order_id: order.id,
        processed_at: new Date().toISOString(),
      },
      { onConflict: 'event_key', ignoreDuplicates: true }
    )
    .select('id');

  if (claimError) {
    console.error('[Cakto Webhook] Could not record event:', claimError.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  if (!claimed || claimed.length === 0) {
    console.log('[Cakto Webhook] Duplicate event, skipping:', eventKey);
    return NextResponse.json({ received: true });
  }

  try {
    const profile = await findProfile(supabase, order);

    if (!profile) {
      // Kept as processed: retrying won't find a user that doesn't exist.
      console.error('[Cakto Webhook] Profile not found for order:', order.id, 'event:', event);
      return NextResponse.json({ received: true, error: 'User not found' });
    }

    await processEvent(supabase, event, order, profile);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Cakto Webhook] Error processing', eventKey, error);
    // Release the claim so a manual resend from the Cakto panel is processed again.
    await supabase.from('webhook_events').delete().eq('event_key', eventKey);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function findProfile(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: NonNullable<ReturnType<typeof normalizePayload>>
): Promise<ProfileRow | null> {
  // 1) callback token = VenceJa user id, set in the checkout URL
  if (order.callback && UUID_RE.test(order.callback)) {
    const { data } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', order.callback).maybeSingle();
    if (data) return data as ProfileRow;
  }

  // 2) subscription id stored on a previous event
  if (order.subscription) {
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('subscription_id', order.subscription)
      .maybeSingle();
    if (data) return data as ProfileRow;
  }

  // 3) buyer email
  if (order.customer.email) {
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('email', order.customer.email)
      .maybeSingle();
    if (data) return data as ProfileRow;
  }

  return null;
}

async function processEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  event: string,
  order: NonNullable<ReturnType<typeof normalizePayload>>,
  profile: ProfileRow
) {
  const userId = profile.id;
  const notifyEmail = profile.email;
  const customerName = order.customer.name || notifyEmail.split('@')[0];
  const subscriptionKey = order.subscription || order.id;

  switch (event) {
    case 'purchase_approved':
    case 'subscription_created': {
      const cycle = order.offer ? getCycleFromOffer(order.offer.name) : 'monthly';
      const price = order.offer?.price ? Number(order.offer.price) : getPlanValue(order.offer?.name || '');
      const now = new Date();
      const nextBillingDate = getNextBillingDate(cycle, now);

      const { error: profileError } = await supabase.from('profiles').update({
        plano: 'pro',
        subscription_id: subscriptionKey,
        subscription_status: 'active',
        subscription_cycle: cycle,
        subscription_started_at: now.toISOString(),
        subscription_ends_at: nextBillingDate.toISOString(),
        cancellation_status: null,
        cancellation_requested_at: null,
        cancellation_type: null,
        cancellation_reason: null,
      }).eq('id', userId);
      assertOk(profileError, 'profiles update');

      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        subscription_id: subscriptionKey,
        plan_type: cycle,
        status: 'active',
        price_cents: Math.round(price * 100),
        current_period_start: now.toISOString(),
        current_period_end: nextBillingDate.toISOString(),
      }, { onConflict: 'subscription_id' });
      assertOk(subError, 'subscriptions upsert');

      await sendPaymentConfirmedEmail(notifyEmail, customerName, cycle, price);
      console.log('[Cakto Webhook] Subscription activated for user:', userId);
      break;
    }

    case 'subscription_renewed': {
      const cycle = order.offer ? getCycleFromOffer(order.offer.name) : 'monthly';
      const price = order.offer?.price ? Number(order.offer.price) : getPlanValue(order.offer?.name || '');
      // Extend from the current period end so early renewals don't lose days.
      const currentEnd = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
      const base = currentEnd && currentEnd > new Date() ? currentEnd : new Date();
      const nextBillingDate = getNextBillingDate(cycle, base);

      const { error: e1 } = await supabase.from('profiles').update({
        plano: 'pro',
        subscription_status: 'active',
        subscription_ends_at: nextBillingDate.toISOString(),
      }).eq('id', userId);
      assertOk(e1, 'profiles update');

      const { error: e2 } = await supabase.from('subscriptions').update({
        status: 'active',
        current_period_start: base.toISOString(),
        current_period_end: nextBillingDate.toISOString(),
      }).eq('subscription_id', subscriptionKey);
      assertOk(e2, 'subscriptions update');

      await sendRenewalConfirmedEmail(
        notifyEmail,
        customerName,
        cycle,
        price,
        nextBillingDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      );
      console.log('[Cakto Webhook] Subscription renewed for user:', userId);
      break;
    }

    case 'subscription_renewal_refused': {
      const { error: e1 } = await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('id', userId);
      assertOk(e1, 'profiles update');

      const { error: e2 } = await supabase.from('subscriptions').update({
        status: 'past_due',
      }).eq('subscription_id', subscriptionKey);
      assertOk(e2, 'subscriptions update');

      await sendPaymentRejectedEmail(
        notifyEmail,
        customerName,
        'A cobrança da sua assinatura não foi processada. Por favor, atualize seu método de pagamento.'
      );
      console.log('[Cakto Webhook] Payment refused for user:', userId);
      break;
    }

    case 'subscription_canceled': {
      const currentEndsAt = profile.subscription_ends_at;
      const currentEndDate = currentEndsAt ? new Date(currentEndsAt) : new Date();
      const endDateFormatted = currentEndDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const stillInPaidPeriod = currentEndDate > new Date();

      const { error: e1 } = await supabase.from('profiles').update({
        ...(stillInPaidPeriod ? {} : { plano: 'free' }),
        subscription_status: 'canceled',
        cancellation_status: 'approved',
        cancellation_requested_at: null,
        cancellation_type: null,
        cancellation_reason: null,
      }).eq('id', userId);
      assertOk(e1, 'profiles update');

      const { error: e2 } = await supabase.from('subscriptions').update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      }).eq('subscription_id', subscriptionKey);
      assertOk(e2, 'subscriptions update');

      await sendSubscriptionCanceledEmail(notifyEmail, customerName, endDateFormatted);
      console.log('[Cakto Webhook] Subscription canceled for user:', userId);
      break;
    }

    case 'refund':
    case 'chargeback': {
      const price = order.offer?.price ? Number(order.offer.price) : 49.90;

      const { error: e1 } = await supabase.from('profiles').update({
        plano: 'free',
        subscription_status: 'canceled',
        subscription_ends_at: new Date().toISOString(),
        cancellation_status: 'approved',
        cancellation_requested_at: null,
        cancellation_type: null,
        cancellation_reason: null,
      }).eq('id', userId);
      assertOk(e1, 'profiles update');

      const { error: e2 } = await supabase.from('subscriptions').update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      }).eq('subscription_id', subscriptionKey);
      assertOk(e2, 'subscriptions update');

      await sendRefundEmail(
        notifyEmail,
        customerName,
        price,
        event === 'chargeback' ? 'Chargeback solicitado' : 'Reembolso solicitado'
      );
      console.log('[Cakto Webhook] Refund/Chargeback for user:', userId);
      break;
    }

    case 'purchase_refused': {
      await sendPaymentRejectedEmail(
        notifyEmail,
        customerName,
        'Seu pagamento foi recusado. Por favor, tente novamente com outro método de pagamento.'
      );
      console.log('[Cakto Webhook] Purchase refused for user:', userId);
      break;
    }

    default:
      console.log('[Cakto Webhook] Unhandled event:', event);
  }
}
