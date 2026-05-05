const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const refundEmailTemplate = (name: string, price: number, reason?: string) => `
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
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Reembolso Processado</h1>
              <p style="color: #ef4444; font-size: 16px; font-weight: 500; margin: 0;">Valor estornado com sucesso</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                O reembolso de <strong style="color: #ef4444;">R$ ${price.toFixed(2).replace('.', ',')}</strong> foi processado e o valor será creditado na sua conta em até 5 dias úteis (dependendo do banco).
              </p>
              ${reason ? `<p style="color: #a3a3a3; font-size: 14px; margin: 12px 0 0 0;">Motivo: ${reason}</p>` : ''}
            </td>
          </tr>
          
          <!-- Info Box -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(59, 130, 246, 0.1); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.3); padding: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">💡 Precisa de ajuda?</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      Se tiver qualquer dúvida sobre o estorno, entre em contato pelo WhatsApp ou email.
                    </p>
                  </td>
                </tr>
              </table>
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

export const refundRequestEmailToAdminTemplate = (
  name: string,
  email: string,
  price: number,
  reason: string,
  subscriptionId: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <h2>Nova Solicitação de Reembolso</h2>
  <p><strong>Cliente:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Valor:</strong> R$ ${price.toFixed(2).replace('.', ',')}</p>
  <p><strong>ID Assinatura:</strong> ${subscriptionId}</p>
  <p><strong>Motivo:</strong> ${reason}</p>
  <hr>
  <p>Acesse o painel Cakto para processar o reembolso (prazo de 7 dias).</p>
</body>
</html>
`;