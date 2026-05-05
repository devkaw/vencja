const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const renewalReminderEmailTemplate = (
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  nextBillingDate: string
) => {
  const formattedDate = new Date(nextBillingDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
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
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Sua assinatura será renovada amanhã!</h1>
              <p style="color: #fbbf24; font-size: 16px; font-weight: 500; margin: 0;">Não se preocupe, é só um aviso</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                Sua assinatura do <strong style="color: #10b981;">Plano Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}</strong> será renovada automaticamente amanhã.
              </p>
            </td>
          </tr>
          
          <!-- Renewal Info Box -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">PRÓXIMA COBRANÇA</p>
                    <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">R$ ${price.toFixed(2).replace('.', ',')}</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">${formattedDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Continue Info -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(59, 130, 246, 0.1); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.3); padding: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">💡 O que acontece agora?</p>
                    <p style="color: #a3a3a3; font-size: 14px; line-height: 20px; margin: 0;">
                      O valor será cobrado automaticamente no cartão cadastrado. Você continuará tendo acesso a todas as funcionalidades do Plano Pro sem interrupção.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Manage Button -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0;">Quer alterar ou cancelar?</p>
              <a href="${APP_URL}/dashboard/upgrade" style="display: inline-block; background-color: #1f2937; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 24px; border-radius: 8px; border: 1px solid #374151;">Gerenciar Assinatura</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px; text-align: center;">
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">Obrigado por usar o VenceJa!</p>
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">© ${new Date().getFullYear()} VenceJa - Gestão de Cobranças Inteligente</p>
              <p style="color: #525252; font-size: 12px; margin: 12px 0 0 0;">Se você já cancelou, pode ignorar este email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

export const renewalConfirmedEmailTemplate = (
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  nextBillingDate: string
) => {
  const formattedDate = new Date(nextBillingDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
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
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Assinatura Renovada!</h1>
              <p style="color: #10b981; font-size: 16px; font-weight: 500; margin: 0;">Tudo certo com sua assinatura</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                Sua assinatura do <strong style="color: #10b981;">Plano Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}</strong> foi renovada com sucesso!
              </p>
            </td>
          </tr>
          
          <!-- Renewal Info Box -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">RENOVAÇÃO CONFIRMADA</p>
                    <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">R$ ${price.toFixed(2).replace('.', ',')}</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">Próxima cobrança: ${formattedDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Features -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Você continua com acesso a:</p>
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
          
          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px; text-align: center;">
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">Obrigado por continuar com a gente!</p>
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
};