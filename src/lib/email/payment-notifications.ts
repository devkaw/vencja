import { Resend } from 'resend';
import { paymentConfirmedEmailTemplate, paymentRejectedEmailTemplate, subscriptionCanceledEmailTemplate, cancellationRequestReceivedEmailTemplate, refundRequestReceivedEmailTemplate } from '@/emails/templates/payment-email';
import { orderReceivedEmailTemplate } from '@/emails/templates/order-received-email';
import { renewalReminderEmailTemplate, renewalConfirmedEmailTemplate } from '@/emails/templates/renewal-email';
import { refundEmailTemplate } from '@/emails/templates/refund-email';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Resend credentials not configured');
    return { success: false, error: { message: 'Resend credentials not configured' } };
  }

  try {
    const data = await resend.emails.send({
      from: `"VenceJa" <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`Resend email sent: ${subject}`, data.data?.id);
    return { success: true, data };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error(`Failed to send ${subject} email:`, {
      message: err?.message,
      code: err?.code,
    });
    return {
      success: false,
      error: {
        message: err?.message || 'Unknown error',
        code: err?.code,
      },
    };
  }
}

export async function sendPaymentConfirmedEmail(
  to: string,
  name: string,
  planType: 'monthly' | 'annual',
  price: number
) {
  const html = paymentConfirmedEmailTemplate(name, planType, price);
  return sendEmail(to, 'Pagamento confirmado! Seu Plano Pro está ativo - VenceJa', html);
}

export async function sendPaymentRejectedEmail(
  to: string,
  name: string,
  reason?: string
) {
  const html = paymentRejectedEmailTemplate(name, reason);
  return sendEmail(to, 'Pagamento não processado - VenceJa', html);
}

export async function sendSubscriptionCanceledEmail(to: string, name: string, endDate?: string) {
  const html = subscriptionCanceledEmailTemplate(name, endDate);
  return sendEmail(to, 'Assinatura cancelada - VenceJa', html);
}

export async function sendCancellationRequestReceivedEmail(
  to: string,
  name: string,
  planType: 'monthly' | 'annual',
  endDate: string
) {
  const html = cancellationRequestReceivedEmailTemplate(name, planType, endDate);
  return sendEmail(to, 'Solicitação de cancelamento recebida - VenceJa', html);
}

export async function sendRefundRequestReceivedEmail(
  to: string,
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  daysRemaining: number
) {
  const html = refundRequestReceivedEmailTemplate(name, planType, price, daysRemaining);
  return sendEmail(to, 'Solicitação de reembolso recebida - VenceJa', html);
}

export async function sendOrderReceivedEmail(
  to: string,
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  orderNumber: string
) {
  const html = orderReceivedEmailTemplate(name, planType, price, orderNumber);
  return sendEmail(to, 'Pedido recebido! Aguardando pagamento - VenceJa', html);
}

export async function sendRenewalReminderEmail(
  to: string,
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  nextBillingDate: string
) {
  const html = renewalReminderEmailTemplate(name, planType, price, nextBillingDate);
  return sendEmail(to, 'Sua assinatura será renovada amanhã - VenceJa', html);
}

export async function sendRenewalConfirmedEmail(
  to: string,
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  nextBillingDate: string
) {
  const html = renewalConfirmedEmailTemplate(name, planType, price, nextBillingDate);
  return sendEmail(to, 'Assinatura renovada! - VenceJa', html);
}

export async function sendRefundEmail(
  to: string,
  name: string,
  price: number,
  reason?: string
) {
  const html = refundEmailTemplate(name, price, reason);
  return sendEmail(to, 'Reembolso processado - VenceJa', html);
}