import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { sendRefundRequestReceivedEmail } from '@/lib/email/payment-notifications';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contato@vencja.com.br';

interface Request {
  reason: string;
}

const REFUND_DAYS = 7;

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

    const purchasedAt = profile.subscription_started_at 
      ? new Date(profile.subscription_started_at) 
      : new Date();
    
    const now = new Date();
    const diffTime = now.getTime() - purchasedAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = REFUND_DAYS - diffDays;

    if (daysRemaining <= 0) {
      return NextResponse.json({ 
        error: 'O prazo de 7 dias para solicitação de reembolso foi excedido. Entre em contato conosco pelo email.' 
      }, { status: 400 });
    }

    const price = profile.subscription_cycle === 'monthly' ? 49.90 : 499.00;

    await supabase.from('profiles').update({
      cancellation_requested_at: new Date().toISOString(),
      cancellation_type: 'refund',
      cancellation_reason: reason,
      cancellation_status: 'pending',
    }).eq('id', user.id);

    await sendRefundRequestReceivedEmail(
      profile.email,
      profile.full_name || profile.email.split('@')[0],
      profile.subscription_cycle || 'monthly',
      price,
      daysRemaining
    );

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `"VenceJa" <${process.env.RESEND_FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `Solicitação de REEMBOLSO - ${profile.email} (${daysRemaining} dias restantes)`,
        html: `
          <h2>Nova solicitação de REEMBOLSO</h2>
          <p><strong>Usuário:</strong> ${profile.full_name || 'Não informado'}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Plano:</strong> ${profile.subscription_cycle === 'monthly' ? 'Pro Mensal' : 'Pro Anual'}</p>
          <p><strong>Valor:</strong> R$ ${price.toFixed(2).replace('.', ',')}</p>
          <p><strong>Data da compra:</strong> ${purchasedAt.toLocaleDateString('pt-BR')}</p>
          <p><strong>Dias desde a compra:</strong> ${diffDays} dias</p>
          <p><strong>Prazo restante para reembolso:</strong> ${daysRemaining} dias</p>
          <p><strong>Motivo:</strong> ${reason}</p>
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

    const purchasedAt = profile.subscription_started_at 
      ? new Date(profile.subscription_started_at) 
      : new Date();
    
    const now = new Date();
    const diffTime = now.getTime() - purchasedAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = REFUND_DAYS - diffDays;

    if (daysRemaining <= 0) {
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