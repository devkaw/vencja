import { button, callout, emailLayout, firstName, linkFallback, list, p, strong } from '../layout';

export const verificationEmailTemplate = (name: string, verifyUrl: string) =>
  emailLayout({
    preheader: 'Falta só um toque para ativar sua conta na VenceJá.',
    eyebrow: 'Bem-vindo',
    title: 'Confirme seu e-mail e comece a cobrar.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}! Que bom ter você na VenceJá.`)}
      ${p('Confirme seu e-mail para ativar a conta. Depois disso, em poucos minutos você já sabe quem te deve:')}
      ${list(['Cadastre seus clientes', 'Lance as cobranças, avulsas ou parceladas', 'Acompanhe vencimentos e cobre pelo WhatsApp'], { numbered: true })}
      ${button(verifyUrl, 'Confirmar meu e-mail')}
      ${linkFallback(verifyUrl)}
      ${callout('warn', 'O link vale por 1 hora', 'Se ele expirar, é só pedir um novo na tela de login.')}
    `,
    footnote: 'Você recebeu este e-mail porque alguém criou uma conta na VenceJá com este endereço. Se não foi você, pode ignorar: nada acontece sem a confirmação.',
  });
