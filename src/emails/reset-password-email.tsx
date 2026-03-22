import { BaseEmail } from './base-template';
import { Section, Text, Button, Hr } from '@react-email/components';

interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
}

export function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <BaseEmail previewText="Solicitação de recuperação de senha - VenceJa">
      <Section style={styles.iconSection}>
        <table style={styles.tableCenter}>
          <tr>
            <td style={styles.iconContainer}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#10b981" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="#10b981"/>
              </svg>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={styles.titleSection}>
        <Text style={styles.title}>Esqueceu sua senha?</Text>
        <Text style={styles.subtitle}>Sem problemas, vamos resolver!</Text>
      </Section>

      <Section style={styles.textSection}>
        <Text style={styles.text}>
          Olá, <strong style={styles.nameHighlight}>{name || 'usuário'}</strong>!
        </Text>
        <Text style={styles.text}>
          Recebemos uma solicitação para redefinir a senha da sua conta no <strong style={styles.brandHighlight}>VenceJa</strong>. Clique no botão abaixo:
        </Text>
      </Section>

      <Section style={styles.buttonSection}>
        <Button href={resetUrl} style={styles.button}>
          Redefinir Senha
        </Button>
      </Section>

      <Section style={styles.linkSection}>
        <Text style={styles.linkText}>Ou clique neste link:</Text>
        <Text style={styles.link}>{resetUrl}</Text>
      </Section>

      <Hr style={styles.hr} />

      <Section style={styles.warningSection}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Importante:</Text>
        <Text style={styles.warningText}>
          Este link expira em <strong>1 hora</strong> e pode ser usado apenas uma vez.
        </Text>
      </Section>

      <Section style={styles.securitySection}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityTitle}>Segurança:</Text>
        <Text style={styles.securityText}>
          Se você <strong>não solicitou</strong> esta recuperação de senha, ignore este email. Sua senha atual permanece inalterada.
        </Text>
      </Section>
    </BaseEmail>
  );
}

export default ResetPasswordEmail;

const styles: Record<string, Record<string, string>> = {
  iconSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  tableCenter: {
    width: '100%',
    textAlign: 'center',
    borderCollapse: 'collapse',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '50%',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#10b981',
    margin: '0',
    fontWeight: '500',
  },
  textSection: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  text: {
    color: '#a3a3a3',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px 0',
  },
  nameHighlight: {
    color: '#ffffff',
  },
  brandHighlight: {
    color: '#10b981',
  },
  buttonSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: '12px',
    color: '#000000',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    padding: '16px 40px',
    display: 'inline-block',
  },
  linkSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  linkText: {
    color: '#525252',
    fontSize: '13px',
    margin: '0 0 8px 0',
  },
  link: {
    color: '#10b981',
    fontSize: '12px',
    wordBreak: 'break-all',
    textDecoration: 'underline',
  },
  hr: {
    borderColor: '#262626',
    margin: '24px 0',
  },
  warningSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  warningIcon: {
    fontSize: '16px',
    margin: '0 0 8px 0',
  },
  warningTitle: {
    color: '#fbbf24',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  warningText: {
    color: '#a3a3a3',
    fontSize: '14px',
    margin: '0',
    lineHeight: '20px',
  },
  securitySection: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  securityIcon: {
    fontSize: '16px',
    margin: '0 0 8px 0',
  },
  securityTitle: {
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  securityText: {
    color: '#a3a3a3',
    fontSize: '14px',
    margin: '0',
    lineHeight: '20px',
  },
};