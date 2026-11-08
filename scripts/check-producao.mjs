// Pre-deploy check: fails while something required for production is missing.
// Run: npm run check:producao (with the production variables loaded in the shell).
const problemas = [];
const avisos = [];

function cpfValido(valor) {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const digito = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

const documento = (process.env.EMPRESA_DOCUMENTO || '').replace(/\D/g, '');
if (documento.length === 11 && !cpfValido(documento)) problemas.push('EMPRESA_DOCUMENTO: CPF inválido');
if (documento && documento.length !== 11 && documento.length !== 14) problemas.push('EMPRESA_DOCUMENTO deve ser um CPF ou CNPJ');
if (!process.env.EMPRESA_ENCARREGADO) avisos.push('EMPRESA_ENCARREGADO vazio: confirme se a dispensa de agente de pequeno porte vale para o seu caso');

const obrigatorias = ['EMPRESA_NOME', 'EMPRESA_DOCUMENTO', 'EMPRESA_ENDERECO', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_APP_URL', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'CAKTO_CLIENT_ID', 'CAKTO_CLIENT_SECRET', 'CAKTO_OFFER_MONTHLY_ID', 'CAKTO_OFFER_ANNUAL_ID', 'CAKTO_WEBHOOK_SECRET', 'CRON_SECRET', 'EMAIL_UNSUBSCRIBE_SECRET', 'ADMIN_EMAIL'];
for (const nome of obrigatorias) {
  if (!process.env[nome]) problemas.push(`Defina a variável ${nome}`);
}

if (process.env.DIGEST_DRY_RUN) problemas.push('Remova DIGEST_DRY_RUN: com ela nenhum aviso diário é enviado');
for (const nome of ['CRON_SECRET', 'EMAIL_UNSUBSCRIBE_SECRET']) {
  if (process.env[nome] && process.env[nome].length < 32) problemas.push(`${nome} deve ter pelo menos 32 caracteres`);
}
if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) problemas.push('NEXT_PUBLIC_APP_URL deve usar https');
if (process.env.NEXT_DIST_DIR) avisos.push('NEXT_DIST_DIR é só para preview local');

avisos.forEach((a) => console.log(`aviso: ${a}`));
problemas.forEach((p) => console.error(`faltando: ${p}`));
if (problemas.length) {
  console.error(`\n${problemas.length} pendência(s). Não publique ainda.`);
  process.exit(1);
}
console.log('Tudo certo para publicar.');
