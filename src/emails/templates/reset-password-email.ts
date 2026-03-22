export const resetPasswordEmailTemplate = (name: string, resetUrl: string) => `
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
                    <div style="width: 48px; height: 48px; background-color: #10b981; border-radius: 12px; display: inline-block;">
                      <span style="color: #000000; font-size: 24px; font-weight: bold; line-height: 48px;">V</span>
                    </div>
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold; margin-left: 12px; vertical-align: middle;">VenceJa</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Esqueceu sua senha?</h1>
              <p style="color: #10b981; font-size: 16px; font-weight: 500; margin: 0;">Sem problemas, vamos resolver!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0 0 12px 0;">
                Olá, <strong style="color: #ffffff;">${name || 'usuário'}</strong>!
              </p>
              <p style="color: #a3a3a3; font-size: 15px; line-height: 24px; margin: 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color: #10b981;">VenceJa</strong>. Clique no botão abaixo:
              </p>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 12px;">Redefinir Senha</a>
            </td>
          </tr>
          
          <!-- Link -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <p style="color: #525252; font-size: 13px; margin: 0 0 8px 0;">Ou clique neste link:</p>
              <a href="${resetUrl}" style="color: #10b981; font-size: 12px; text-decoration: underline; word-break: break-all;">${resetUrl}</a>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px;">
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(251, 191, 36, 0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #fbbf24; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">⚠️ Importante:</p>
                    <p style="color: #a3a3a3; font-size: 14px; line-height: 20px; margin: 0;">
                      Este link expira em <strong>1 hora</strong> e pode ser usado apenas uma vez.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">🔒 Segurança:</p>
                    <p style="color: #a3a3a3; font-size: 14px; line-height: 20px; margin: 0;">
                      Se você <strong>não solicitou</strong> esta recuperação de senha, ignore este email. Sua senha atual permanece inalterada.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 24px; text-align: center;">
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">Este email foi enviado pela equipe VenceJa.</p>
              <p style="color: #737373; font-size: 14px; margin: 4px 0;">© ${new Date().getFullYear()} VenceJa - Gestão de Cobranças Inteligente</p>
              <p style="color: #525252; font-size: 12px; margin: 12px 0 0 0;">Se você não reconhece esta ação, pode ignorar este email com segurança.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;