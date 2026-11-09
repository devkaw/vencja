import { callout, emailLayout, esc, firstName, list, p, receipt, strong } from '../layout';
import { formatCurrency } from '@/lib/utils';

export const orderReceivedEmailTemplate = (name: string, planType: 'monthly' | 'annual', price: number, orderNumber: string) =>
  emailLayout({
    preheader: `Pedido #${orderNumber} recebido. Assim que o pagamento cair, seu Pro é ativado.`,
    eyebrow: 'Aguardando pagamento',
    tone: 'warn',
    title: 'Recebemos seu pedido do Pro.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}! Seu pedido chegou. Assim que o pagamento for confirmado, o Plano Pro é ativado na hora.`)}
      ${receipt({
        label: `Pedido #${esc(orderNumber)}`,
        value: formatCurrency(price),
        note: `Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}`,
        tone: 'warn',
      })}
      ${list(
        [
          'Abra o link de pagamento que apareceu no checkout',
          'Pague com PIX, cartão ou boleto',
          'Pronto: você recebe um e-mail confirmando o Pro',
        ],
        { title: 'Como concluir', numbered: true, tone: 'warn' }
      )}
      ${callout('neg', 'O pedido vale por 7 dias', 'Depois disso ele expira e você precisa fazer um novo.')}
    `,
  });
