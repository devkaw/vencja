/**
 * Quem responde pelo site. O Decreto 7.962/2013 pede nome, CPF ou CNPJ e endereço em sites de venda.
 * Nome, documento e endereço vêm de variáveis de ambiente para não ficarem guardados no código.
 * Páginas estáticas leem esses valores no build: depois de mudar uma variável, publique de novo.
 */
export const EMPRESA = {
  marca: 'VenceJá',
  nome: process.env.EMPRESA_NOME || '',
  documento: process.env.EMPRESA_DOCUMENTO || '',
  endereco: process.env.EMPRESA_ENDERECO || '',
  encarregadoNome: process.env.EMPRESA_ENCARREGADO || '',
  emailSuporte: 'suporte@venceja.com.br',
  emailPrivacidade: 'suporte@venceja.com.br',
  site: 'https://www.venceja.com.br',
};

/** Prazo em que pedidos de cancelamento e reembolso são tratados. É um compromisso público: confirme antes de publicar. */
export const PRAZO_ATENDIMENTO = '2 dias úteis';

/** Prazo de resposta do suporte para assinantes Pro: é o "suporte prioritário" prometido. Compromisso público. */
export const PRAZO_SUPORTE_PRO = '1 dia útil';
export const SUPORTE_PRIORITARIO = `Suporte prioritário, com resposta em até ${PRAZO_SUPORTE_PRO}`;
/** Assunto que identifica o assinante Pro na caixa de entrada do suporte. */
export const ASSUNTO_SUPORTE_PRO = '[Pro] Suporte VenceJá';

/** Mude ao alterar Termos ou Privacidade de forma relevante: fica registrado no aceite de cada conta. */
export const VERSAO_TERMOS = '2026-11-08';
export const ATUALIZACAO_LEGAL = '8 de novembro de 2026';

export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function formatarDocumento(valor: string): string {
  const d = valor.replace(/\D/g, '');
  if (d.length === 11) return `CPF ${d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`;
  if (d.length === 14) return `CNPJ ${d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`;
  return valor;
}

export function montarIdentificacao(nome: string, documento: string, endereco: string): string {
  return [nome || EMPRESA.marca, formatarDocumento(documento), endereco].filter(Boolean).join(' · ');
}

export function identificacaoEmpresa(): string {
  return montarIdentificacao(EMPRESA.nome, EMPRESA.documento, EMPRESA.endereco);
}
