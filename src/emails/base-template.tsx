import { Html, Head, Body, Container, Section, Text, Hr } from '@react-email/components';

interface BaseEmailProps {
  children: React.ReactNode;
  previewText?: string;
}

export function BaseEmail({ children }: BaseEmailProps) {
  return (
    <Html>
      <Head>
        <title>VenceJa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <table style={styles.tableCenter}>
              <tr>
                <td style={styles.logo}>
                  <span style={styles.logoText}>V</span>
                </td>
                <td style={styles.brandNameCell}>
                  <span style={styles.brandName}>VenceJa</span>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={styles.content}>
            {children}
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Este email foi enviado pela equipe VenceJa.
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} VenceJa - Gestão de Cobranças Inteligente
            </Text>
            <Text style={styles.footerSmall}>
              Se você não reconhece esta ação, pode ignorar este email com segurança.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, Record<string, string>> = {
  body: {
    backgroundColor: '#000000',
    fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px 0',
    margin: '0',
  },
  container: {
    backgroundColor: '#0a0a0a',
    borderRadius: '16px',
    margin: '0 auto',
    maxWidth: '560px',
    padding: '40px',
    border: '1px solid #1f1f1f',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  tableCenter: {
    width: '100%',
    textAlign: 'center',
    borderCollapse: 'collapse',
  },
  logo: {
    width: '48px',
    height: '48px',
    backgroundColor: '#10b981',
    borderRadius: '12px',
    textAlign: 'center',
    verticalAlign: 'middle',
    padding: '0',
  },
  logoText: {
    color: '#000000',
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '48px',
  },
  brandNameCell: {
    textAlign: 'left',
    verticalAlign: 'middle',
    paddingLeft: '12px',
  },
  brandName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    marginBottom: '24px',
  },
  hr: {
    borderColor: '#262626',
    margin: '24px 0',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    color: '#737373',
    fontSize: '14px',
    margin: '4px 0',
  },
  footerSmall: {
    color: '#525252',
    fontSize: '12px',
    margin: '12px 0 0 0',
  },
};