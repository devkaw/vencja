import { button, callout, emailLayout, firstName, linkFallback, p, strong } from '../layout';

export const resetPasswordEmailTemplate = (name: string, resetUrl: string) =>
  emailLayout({
    preheader: 'Use o link para criar uma senha nova. Ele vale por 1 hora.',
    eyebrow: 'Segurança',
    tone: 'info',
    title: 'Vamos criar uma senha nova.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}. Recebemos um pedido para redefinir a senha da sua conta na VenceJá.`)}
      ${p('Toque no botão abaixo e escolha a nova senha:')}
      ${button(resetUrl, 'Criar nova senha')}
      ${linkFallback(resetUrl)}
      ${callout('warn', 'O link vale por 1 hora', 'E só pode ser usado uma vez. Se expirar, peça outro em “Esqueci a senha”.')}
      ${callout('neutral', 'Não foi você?', 'Ignore este e-mail. Sua senha atual continua valendo e ninguém entra na sua conta sem ela.')}
    `,
  });
