const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const orderReceivedEmailTemplate = (
  name: string,
  planType: 'monthly' | 'annual',
  price: number,
  orderNumber: string
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
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Pedido Recebido!</h1>
              <p style="color: #fbbf24; font-size: 16px; font-weight: 500; margin: 0;">Aguardando pagamento</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Recebemos seu pedido e estamos <strong style="color: #fbbf24;">aguardando o pagamento</strong> para ativar sua assinatura do Plano Pro.
              </p>
            </td>
          </tr>
          
          <!-- Order Info Box -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(251, 191, 36, 0.1); border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.3); padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #fbbf24; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">PEDIDO #${orderNumber}</p>
                    <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Pro ${planType === 'annual' ? 'Anual' : 'Mensal'}</p>
                    <p style="color: #a3a3a3; font-size: 18px; margin: 0;">R$ ${price.toFixed(2).replace('.', ',')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- How to Pay -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Como pagar:</p>
              <ul style="color: #a3a3a3; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Acesse o link de pagamento que você recebeu no checkout</li>
                <li style="margin-bottom: 8px;">Escolha seu método de pagamento preferido (PIX, cartão ou boleto)</li>
                <li style="margin-bottom: 8px;">Efetue o pagamento para ativar sua assinatura</li>
                <li>Após a confirmação, você receberá um email de confirmação</li>
              </ul>
            </td>
          </tr>
          
          <!-- Expiration Warning -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">⏰ Importante:</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      O pedido expira em 7 dias. Não esqueça de efetivar o pagamento para garantir sua assinatura.
                    </p>
                  </td>
                </tr>
              </table>
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