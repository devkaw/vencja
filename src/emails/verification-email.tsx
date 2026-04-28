import { BaseEmail } from './base-template';
import { Section, Text, Button, Hr } from '@react-email/components';

interface VerificationEmailProps {
  name: string;
  verifyUrl: string;
}

export function VerificationEmail({ name, verifyUrl }: VerificationEmailProps) {
  return (
    <BaseEmail previewText="Confirme seu email para ativar sua conta VenceJa">
      <Section style={styles.iconSection}>
        <table style={styles.tableCenter}>
          <tr>
            <td style={styles.iconContainer}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={styles.titleSection}>
        <Text style={styles.title}>Bem-vindo ao VenceJa!</Text>
        <Text style={styles.subtitle}>Confirme seu email para continuar</Text>
      </Section>

      <Section style={styles.textSection}>
        <Text style={styles.text}>
          Olá, <strong style={styles.nameHighlight}>{name || 'usuário'}</strong>!
        </Text>
        <Text style={styles.text}>
          Você está a um passo de ativar sua conta no <strong style={styles.brandHighlight}>VenceJa</strong>. Para começar a gerenciar suas cobranças de forma inteligente, confirme seu email:
        </Text>
      </Section>

      <Section style={styles.buttonSection}>
        <Button href={verifyUrl} style={styles.button}>
          Confirmar Email
        </Button>
      </Section>

      <Section style={styles.linkSection}>
        <Text style={styles.linkText}>Ou clique neste link:</Text>
        <Text style={styles.link}>{verifyUrl}</Text>
      </Section>

      <Hr style={styles.hr} />

      <Section style={styles.warningSection}>
        <Text style={styles.warningIcon}>⚡</Text>
        <Text style={styles.warningTitle}>Importante:</Text>
        <Text style={styles.warningText}>
          Este link expira em <strong>1 hora</strong>. Após expirar, você precisará solicitar um novo email de confirmação.
        </Text>
      </Section>
    </BaseEmail>
  );
}

export default VerificationEmail;

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
};