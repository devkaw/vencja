import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildCheckoutUrl, getMonthlyOfferId, getAnnualOfferId } from '@/lib/cakto/checkout';

interface Request {
  planType: 'monthly' | 'annual';
}

const PLANS = {
  monthly: { name: 'Plano Pro Mensal', value: 49.90, cycle: 'MONTHLY' },
  annual: { name: 'Plano Pro Anual', value: 499.00, cycle: 'YEARLY' },
};

export async function POST(request: NextRequest) {
  try {
    const body: Request = await request.json();
    const { planType } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const offerId = planType === 'monthly' ? getMonthlyOfferId() : getAnnualOfferId();
    const plan = PLANS[planType];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vencja.com.br';

    const checkoutUrl = buildCheckoutUrl({
      offerId,
      customerEmail: user.email || '',
      customerName: user.email?.split('@')[0] || '',
      returnUrl: `${appUrl}/dashboard/upgrade/success`,
      customId: user.id,
    });

    console.log('[Subscription] Checkout URL gerada:', checkoutUrl);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      planType,
      planName: plan.name,
      planValue: plan.value,
    });

  } catch (error) {
    console.error('[Subscription] Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        return NextResponse.json({ error: 'Configuração de pagamento incompleta' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}