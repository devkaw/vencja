import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';
import { escapeHtml } from '@/lib/utils';
import { Resend } from 'resend';
import { sendRefundRequestReceivedEmail } from '@/lib/email/payment-notifications';
import { prazoReembolso } from '@/lib/domain/reembolso';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contato@venceja.com.br';

interface Request {
  reason: string;
}


export async function POST(request: NextRequest) {
  try {
    const body: Request = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Por favor, informe o motivo do reembolso' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    if (profile.plano !== 'pro') {
      return NextResponse.json({ error: 'Você não possui uma assinatura ativa' }, { status: 400 });
    }

    if (profile.cancellation_status === 'pending') {
      return NextResponse.json({ error: 'Você já possui uma solicitação pendente' }, { status: 400 });
    }

    if (!profile.subscription_started_at) {
      return NextResponse.json({ eligible: false, error: 'Data da compra não encontrada. Entre em contato pelo email.', reason: 'Data da compra não encontrada' }, { status: 400 });
    }
    const purchasedAt = new Date(profile.subscription_started_at);
    
    const { elegivel, diasRestantes: daysRemaining, diasDesdeCompra: diffDays } = prazoReembolso(purchasedAt);

    if (!elegivel) {
      return NextResponse.json({ 
        error: 'O prazo de 7 dias para solicitação de reembolso foi excedido. Entre em contato conosco pelo email.' 
      }, { status: 400 });
    }

    const price = profile.subscription_cycle === 'monthly' ? 49.90 : 499.00;

    const { error: updateError } = await createAdminClient().from('profiles').update({
      cancellation_requested_at: new Date().toISOString(),
      cancellation_type: 'refund',
      cancellation_reason: String(reason).slice(0, 1000),
      cancellation_status: 'pending',
    }).eq('id', user.id);

    if (updateError) {
      console.error('[Subscription request] Update error:', updateError.message);
      return NextResponse.json({ error: 'Erro ao registrar solicitação' }, { status: 500 });
    }

    await sendRefundRequestReceivedEmail(
      profile.email,
      profile.email.split('@')[0],
      profile.subscription_cycle || 'monthly',
      price,
      daysRemaining
    );

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `"VenceJá" <${process.env.RESEND_FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `Solicitação de REEMBOLSO - ${profile.email} (${daysRemaining} dias restantes)`,
        html: `
          <h2>Nova solicitação de REEMBOLSO</h2>
          <p><strong>Email:</strong> ${escapeHtml(profile.email)}</p>
          <p><strong>Plano:</strong> ${profile.subscription_cycle === 'monthly' ? 'Pro Mensal' : 'Pro Anual'}</p>
          <p><strong>Valor:</strong> R$ ${price.toFixed(2).replace('.', ',')}</p>
          <p><strong>Data da compra:</strong> ${purchasedAt.toLocaleDateString('pt-BR')}</p>
          <p><strong>Dias desde a compra:</strong> ${diffDays} dias</p>
          <p><strong>Prazo restante para reembolso:</strong> ${daysRemaining} dias</p>
          <p><strong>Motivo:</strong> ${escapeHtml(String(reason))}</p>
          <hr>
          <h3>Ação necessária:</h3>
          <p><strong>Dentro do prazo (7 dias):</strong> Vá ao painel Cakto → Pedidos → Encontrar o pedido → Reembolsar</p>
          <p><strong>Fora do prazo:</strong> O reembolso precisa ser negado. Responda ao cliente explicando.</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação de reembolso enviada com sucesso. Você receberá um email de confirmação em breve.',
      status: 'pending',
      daysRemaining,
      purchaseDate: purchasedAt.toLocaleDateString('pt-BR'),
    });

  } catch (error) {
    console.error('[Refund] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plano, subscription_started_at, subscription_cycle, cancellation_status, cancellation_type, cancellation_requested_at')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ eligible: false, reason: 'Assinatura não encontrada' });
    }

    if (profile.plano !== 'pro') {
      return NextResponse.json({ eligible: false, reason: 'Você não possui assinatura Pro' });
    }

    if (profile.cancellation_status === 'pending') {
      return NextResponse.json({ 
        eligible: false, 
        reason: 'Você já possui uma solicitação pendente',
        status: profile.cancellation_type,
        requestedAt: profile.cancellation_requested_at,
      });
    }

    if (!profile.subscription_started_at) {
      return NextResponse.json({ eligible: false, error: 'Data da compra não encontrada. Entre em contato pelo email.', reason: 'Data da compra não encontrada' }, { status: 400 });
    }
    const purchasedAt = new Date(profile.subscription_started_at);
    
    const { elegivel, diasRestantes: daysRemaining, diasDesdeCompra: diffDays } = prazoReembolso(purchasedAt);

    if (!elegivel) {
      return NextResponse.json({ 
        eligible: false, 
        reason: 'Prazo de 7 dias excedido',
        purchaseDate: purchasedAt.toLocaleDateString('pt-BR'),
        daysSincePurchase: diffDays,
      });
    }

    return NextResponse.json({
      eligible: true,
      daysRemaining,
      purchaseDate: purchasedAt.toLocaleDateString('pt-BR'),
      daysSincePurchase: diffDays,
    });

  } catch (error) {
    console.error('[Refund Check] Error:', error);
    return NextResponse.json({ eligible: false, reason: 'Erro ao verificar' });
  }
}