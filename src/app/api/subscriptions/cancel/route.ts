import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { sendCancellationRequestReceivedEmail } from '@/lib/email/payment-notifications';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contato@vencja.com.br';

interface Request {
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: Request = await request.json();
    const { reason } = body;

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

    const endsAt = profile.subscription_ends_at 
      ? new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR')
      : 'fim do período atual';
    const endsAtDate = profile.subscription_ends_at 
      ? new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR')
      : 'o fim do período atual';

    await supabase.from('profiles').update({
      cancellation_requested_at: new Date().toISOString(),
      cancellation_type: 'cancel',
      cancellation_reason: reason || 'Não informado',
      cancellation_status: 'pending',
    }).eq('id', user.id);

    await sendCancellationRequestReceivedEmail(
      profile.email,
      profile.email.split('@')[0],
      profile.subscription_cycle || 'monthly',
      endsAtDate
    );

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `"VenceJa" <${process.env.RESEND_FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `Solicitação de cancelamento - ${profile.email}`,
        html: `
          <h2>Nova solicitação de cancelamento</h2>
          <p><strong>Usuário:</strong> ${profile.email}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Plano:</strong> ${profile.subscription_cycle === 'monthly' ? 'Pro Mensal' : 'Pro Anual'}</p>
          <p><strong>Valor:</strong> R$ ${profile.subscription_cycle === 'monthly' ? '49,90/mês' : '499,00/ano'}</p>
          <p><strong>Accesso até:</strong> ${endsAt}</p>
          <p><strong>Motivo:</strong> ${reason || 'Não informado'}</p>
          <hr>
          <p>Para processar o cancelamento, vá ao painel Cakto → Assinaturas → Encontrar a assinatura → Cancelar</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação de cancelamento enviada com sucesso. Você receberá um email de confirmação em breve.',
      status: 'pending',
    });

  } catch (error) {
    console.error('[Cancel] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}