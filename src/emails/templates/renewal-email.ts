import { SUPORTE_PRIORITARIO } from '@/lib/legal';
import { formatCurrency } from '@/lib/utils';
import { APP_URL, PRO_FEATURES, button, callout, emailLayout, firstName, list, p, receipt, strong } from '../layout';

const dataLonga = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const plano = (planType: 'monthly' | 'annual') => `Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}`;

export const renewalReminderEmailTemplate = (name: string, planType: 'monthly' | 'annual', price: number, nextBillingDate: string) => {
  const data = dataLonga(nextBillingDate);
  return emailLayout({
    preheader: `Amanhã renovamos seu ${plano(planType)} por ${formatCurrency(price)}. É só um aviso.`,
    eyebrow: 'Aviso de renovação',
    title: 'Seu Pro renova amanhã.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}! É só um aviso: amanhã a assinatura do ${strong(plano(planType))} é renovada automaticamente.`)}
      ${receipt({ label: 'Próxima cobrança', value: formatCurrency(price), note: data })}
      ${callout('info', 'O que acontece agora', 'O valor é cobrado na forma de pagamento cadastrada e você segue com o Pro, sem interrupção.')}
      ${p('Quer mudar de plano ou cancelar? Dá para fazer sozinho, em Configurações › Plano.', { muted: true, size: 14, mt: 22 })}
      ${button(`${APP_URL}/dashboard/settings?secao=plan`, 'Gerenciar assinatura', 'secondary')}
    `,
    footnote: 'Se você já cancelou, pode ignorar este e-mail.',
  });
};

export const renewalConfirmedEmailTemplate = (name: string, planType: 'monthly' | 'annual', price: number, nextBillingDate: string) => {
  const data = dataLonga(nextBillingDate);
  return emailLayout({
    preheader: `Renovação de ${formatCurrency(price)} confirmada. Próxima em ${data}.`,
    eyebrow: 'Renovação confirmada',
    tone: 'pos',
    title: 'Tudo certo: seu Pro foi renovado.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}! A assinatura do ${strong(plano(planType))} foi renovada. Obrigado por continuar com a gente.`)}
      ${receipt({ label: 'Valor renovado', value: formatCurrency(price), rows: [['Próxima cobrança', data]], tone: 'pos' })}
      ${list(PRO_FEATURES(SUPORTE_PRIORITARIO), { title: 'Você continua com' })}
      ${button(`${APP_URL}/dashboard`, 'Abrir meu painel')}
    `,
  });
};
