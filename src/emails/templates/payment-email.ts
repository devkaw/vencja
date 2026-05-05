const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const paymentConfirmedEmailTemplate = (
  name: string,
  planType: 'monthly' | 'annual',
  price: number
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; padding: 40px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <img src="${APP_URL}/logo.png" alt="VenceJa" width="40" height="40" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; display: inline-block; vertical-align: middle;" />
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold; margin-left: 12px; vertical-align: middle;">VenceJa</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Pagamento Confirmado!</h1>
              <p style="color: #10b981; font-size: 16px; font-weight: 500; margin: 0;">Seu Plano Pro está ativo</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Seu pagamento foi confirmado e seu <strong style="color: #10b981;">Plano Pro</strong> está agora ativo!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                Você agora tem acesso a todas as funcionalidades exclusivas do Plano Pro.
              </p>
            </td>
          </tr>
          
          <!-- Plan Info Box -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">PLANO ATIVO</p>
                    <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}</p>
                    <p style="color: #a3a3a3; font-size: 16px; margin: 0;">R$ ${price.toFixed(2).replace('.', ',')}/${planType === 'annual' ? 'ano' : 'mês'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Features -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">O que você ganha:</p>
              <ul style="color: #a3a3a3; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Clientes ilimitados</li>
                <li style="margin-bottom: 8px;">Cobranças ilimitadas</li>
                <li style="margin-bottom: 8px;">Cobrança via WhatsApp</li>
                <li style="margin-bottom: 8px;">Cobranças recorrentes</li>
                <li style="margin-bottom: 8px;">Exportação CSV</li>
                <li>Suporte prioritário</li>
              </ul>
            </td>
          </tr>
          
          <!-- Next Charge Info -->
          ${planType === 'monthly' ? `
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(251, 191, 36, 0.1); border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #fbbf24; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Próxima cobrança</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      Sua próxima cobrança de <strong style="color: #ffffff;">R$ 49,90</strong> será feita automaticamente no mesmo dia do próximo mês.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px; text-align: center;">
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">Precisa de ajuda? Fale conosco pelo WhatsApp</p>
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">© ${new Date().getFullYear()} VenceJa - Gestão de Cobranças Inteligente</p>
              <p style="color: #525252; font-size: 12px; margin: 12px 0 0 0;">Se você não reconhece esta ação, entre em contato conosco.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const paymentRejectedEmailTemplate = (
  name: string,
  reason?: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; padding: 40px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <img src="${APP_URL}/logo.png" alt="VenceJa" width="40" height="40" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; display: inline-block; vertical-align: middle;" />
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold; margin-left: 12px; vertical-align: middle;">VenceJa</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Pagamento Não Efetivado</h1>
              <p style="color: #ef4444; font-size: 16px; font-weight: 500; margin: 0;">Ops! Algo deu errado</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                Infelizmente não foi possível processar seu pagamento. ${reason ? `Motivo: ${reason}` : 'Por favor, verifique os dados do seu cartão e tente novamente.'}
              </p>
            </td>
          </tr>
          
          <!-- What Happened -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">O QUE ACONTECEU?</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      Seu pagamento foi rejeitado e você permanecerá no plano gratuito.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- How to Fix -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Como resolver:</p>
              <ul style="color: #a3a3a3; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Verifique se os dados do cartão estão corretos</li>
                <li style="margin-bottom: 8px;">Certifique-se de que o cartão está ativo para compras online</li>
                <li style="margin-bottom: 8px;">Verifique o limite do seu cartão</li>
                <li>Tente usar outro método de pagamento</li>
              </ul>
            </td>
          </tr>
          
          <!-- Try Again -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <a href="${APP_URL}/dashboard/upgrade" style="display: inline-block; background-color: #10b981; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 12px;">Tentar Novamente</a>
            </td>
          </tr>
          
          <!-- Support -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px; text-align: center;">
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">Precisa de ajuda? Fale conosco pelo WhatsApp</p>
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">© ${new Date().getFullYear()} VenceJa - Gestão de Cobranças Inteligente</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const subscriptionCanceledEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; padding: 40px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <img src="${APP_URL}/logo.png" alt="VenceJa" width="40" height="40" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; display: inline-block; vertical-align: middle;" />
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold; margin-left: 12px; vertical-align: middle;">VenceJa</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Assinatura Cancelada</h1>
              <p style="color: #f59e0b; font-size: 16px; font-weight: 500; margin: 0;">Seu acesso foi modificado</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                Sua assinatura do Plano Pro foi cancelada e você agora possui acesso ao plano gratuito.
              </p>
            </td>
          </tr>
          
          <!-- What Happens -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.1); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3); padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">O QUE ACONTECEU?</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      Você ainda pode acessar seus clientes e cobranças existentes, mas voltou a ter o limite do plano gratuito (3 clientes e 10 cobranças).
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Back Anytime -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0;">Quando quiser, pode voltar a qualquer momento!</p>
              <a href="${APP_URL}/dashboard/upgrade" style="display: inline-block; background-color: #10b981; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 12px;">Voltar a ser Pro</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px; text-align: center;">
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">Obrigado por usar o VenceJa!</p>
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">© ${new Date().getFullYear()} VenceJa - Gestão de Cobranças Inteligente</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;