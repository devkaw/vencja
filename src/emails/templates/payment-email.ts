import { PRAZO_ATENDIMENTO, SUPORTE_PRIORITARIO } from '@/lib/legal';
import { PLANS } from '@/lib/subscription';
import { formatCurrency } from '@/lib/utils';
import { APP_URL, PRO_FEATURES, button, callout, emailLayout, esc, firstName, list, p, receipt, strong } from '../layout';

const plano = (planType: 'monthly' | 'annual') => `Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}`;
const { maxClients, maxCharges } = PLANS.free.limits;

export const paymentConfirmedEmailTemplate = (name: string, planType: 'monthly' | 'annual', price: number) =>
  emailLayout({
    preheader: 'Pagamento confirmado. Clientes, cobranças e WhatsApp sem limite a partir de agora.',
    eyebrow: 'Pagamento confirmado',
    tone: 'pos',
    title: 'Seu Plano Pro está ativo.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}! Pagamento confirmado. A partir de agora sua conta não tem mais limite.`)}
      ${receipt({
        label: 'Plano ativo',
        value: plano(planType),
        note: `${formatCurrency(price)} por ${planType === 'annual' ? 'ano' : 'mês'}`,
        tone: 'pos',
        rows: planType === 'monthly' ? [['Renovação', 'Automática, no mesmo dia do mês que vem']] : [['Renovação', 'Automática, daqui a 12 meses']],
      })}
      ${list(PRO_FEATURES(SUPORTE_PRIORITARIO), { title: 'O que você ganhou' })}
      ${button(`${APP_URL}/dashboard`, 'Começar a usar o Pro')}
      ${callout('info', 'Garantia de 7 dias', 'Se mudar de ideia nos primeiros 7 dias, peça o reembolso integral em Configurações › Plano.')}
    `,
  });

export const paymentRejectedEmailTemplate = (name: string, reason?: string) =>
  emailLayout({
    preheader: 'O pagamento não passou. Veja como resolver em um minuto.',
    eyebrow: 'Pagamento não aprovado',
    tone: 'neg',
    title: 'Seu pagamento não foi aprovado.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}. Não conseguimos concluir o pagamento do Pro, então sua conta segue no plano grátis. Nenhum valor foi cobrado.`)}
      ${reason ? callout('neg', 'Motivo informado', esc(reason)) : ''}
      ${list(
        ['Confira os dados do cartão', 'Veja se o cartão está liberado para compras on-line', 'Confira o limite disponível', 'Ou tente outra forma: PIX ou boleto'],
        { title: 'Como resolver', numbered: true, tone: 'neg' }
      )}
      ${button(`${APP_URL}/dashboard/upgrade`, 'Tentar de novo')}
    `,
  });

export const subscriptionCanceledEmailTemplate = (name: string, endDate?: string) =>
  emailLayout({
    preheader: 'Sua assinatura foi cancelada. Seus dados continuam guardados.',
    eyebrow: 'Assinatura cancelada',
    tone: 'neutral',
    title: 'Seu Pro foi cancelado.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}. Confirmamos o cancelamento da sua assinatura do Plano Pro.`)}
      ${receipt({
        label: 'Plano atual',
        value: 'Grátis',
        note: `${endDate ? `O Pro terminou em ${esc(endDate)}. ` : ''}Até ${maxClients} clientes e ${maxCharges} cobranças.`,
        tone: 'neutral',
      })}
      ${p('Nada foi apagado: seus clientes, cobranças e histórico continuam na conta. Quando quiser voltar, o Pro libera tudo de novo na hora.', { muted: true, size: 14 })}
      ${button(`${APP_URL}/dashboard/upgrade`, 'Voltar para o Pro')}
    `,
    footnote: 'Obrigado por ter usado o Pro. Se algo faltou, conte pra gente pelo e-mail de suporte.',
  });

export const cancellationRequestReceivedEmailTemplate = (name: string, planType: 'monthly' | 'annual', endDate: string) =>
  emailLayout({
    preheader: `Pedido de cancelamento recebido. Você segue com o Pro até ${endDate}.`,
    eyebrow: 'Cancelamento em análise',
    tone: 'warn',
    title: 'Recebemos seu pedido de cancelamento.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}. Recebemos o pedido para cancelar o ${strong(plano(planType))}. Respondemos em até ${strong(PRAZO_ATENDIMENTO)}.`)}
      ${receipt({ label: 'Você segue com o Pro até', value: esc(endDate), note: 'Depois disso a conta passa para o plano grátis, sem multa.', tone: 'warn' })}
      ${list(
        [`Até ${maxClients} clientes e ${maxCharges} cobranças`, 'Sem a mensagem pronta no WhatsApp', 'Sem relatórios completos e exportação em CSV', 'Seus clientes, cobranças e histórico continuam guardados'],
        { title: 'O que muda depois', tone: 'warn' }
      )}
      ${p('Mudou de ideia? Responda pelo e-mail de suporte antes da data acima.', { muted: true, size: 14, mt: 22 })}
    `,
  });

export const refundRequestReceivedEmailTemplate = (name: string, planType: 'monthly' | 'annual', price: number, daysRemaining: number) =>
  emailLayout({
    preheader: `Pedido de reembolso de ${formatCurrency(price)} recebido. Respondemos em até ${PRAZO_ATENDIMENTO}.`,
    eyebrow: 'Reembolso em análise',
    tone: 'info',
    title: 'Recebemos seu pedido de reembolso.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}. Recebemos o pedido de reembolso do ${strong(plano(planType))}. Respondemos em até ${strong(PRAZO_ATENDIMENTO)}.`)}
      ${receipt({
        label: 'Valor do reembolso',
        value: formatCurrency(price),
        tone: 'info',
        rows: [['Prazo da garantia', daysRemaining === 0 ? 'Último dia' : `${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`]],
      })}
      ${callout('info', 'O que acontece agora', 'Você continua com o Pro enquanto analisamos. Depois da aprovação, o valor é estornado em até 5 dias úteis.')}
    `,
  });
