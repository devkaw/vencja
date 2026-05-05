'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Users, Database, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PrivacidadePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-light">Voltar</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-slate dark:prose-invert max-w-none"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extralight">Política de Privacidade</h1>
              <p className="text-slate-500">Última atualização: Janeiro 2025</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Badge variant="primary"> LGPD</Badge>
            <Badge variant="success"> GDPR Ready</Badge>
            <Badge variant="warning"> Dados Criptografados</Badge>
          </div>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            A sua privacidade é importante para o VenceJa. Esta Política de Privacidade (&quot;Política&quot;) explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>

          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-light">1. Dados que Coletamos</h2>
            </div>
            
            <h3 className="text-lg font-light mb-2">1.1 Dados Cadastrais</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Coletamos os seguintes dados quando você cria uma Conta:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
              <li>Nome completo</li>
              <li>Endereço de email</li>
              <li>Senha (armazenada de forma criptografada)</li>
            </ul>

            <h3 className="text-lg font-light mb-2">1.2 Dados de Clientes</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Você pode cadastrar informações de seus clientes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
              <li>Nome</li>
              <li>Email</li>
              <li>Telefone</li>
              <li>Endereço</li>
              <li>Dados de cobranças e pagamentos</li>
            </ul>

            <h3 className="text-lg font-light mb-2">1.3 Dados de Navigation</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Coletamos automaticamente dados de navegación para melhorar nosso Serviço:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mt-2">
              <li>Endereço IP</li>
              <li>Tipo de navegador</li>
              <li>Dispositivo</li>
              <li>Páginas visitadas</li>
              <li>Data e horário de acesso</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-light">2. Como Usamos seus Dados</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Usamos seus dados para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li>Fornecer e manter nosso Serviço</li>
              <li>Processar suas cobranças e pagamentos</li>
              <li>Enviar comunicções importantes</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Analisar o uso do Serviço</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-light">3. Base Legal (LGPD)</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Processamos seus dados com base nas seguintes bases legais:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>Consentimento</strong> - Para envio de marketing e comunicações</li>
              <li><strong>Execução de contrato</strong> - Para prestação do Serviço</li>
              <li><strong>Obrigação legal</strong> - Para cumprimento de obrigações fiscais</li>
              <li><strong>Legítimo interesse</strong> - Para melhoria do Serviço</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-light">4. Compartilhamento de Dados</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Compartilhamos seus dados apenas quando necessário:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>Processadores de pagamento</strong> - Asaas (para processamento de PIX e cartões)</li>
              <li><strong>Fornecedores de infraestrutura</strong> - Supabase (hospedagem)</li>
              <li><strong>Obrigação legal</strong> - Quando exigido por lei</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-400 mt-4">
              <strong>Não vendemos</strong> seus dados pessoais a terceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">5. Retenção de Dados</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Mantemos seus dados enquanto sua Conta estiver ativa ou pelo tempo necessário para fornecer o Serviço. Você pode solicitar a exclusão de seus dados a qualquer momento. Após a exclusão da Conta, os dados são removidos em até 30 dias, exceto quando exigido por lei (ex: obrigações fiscais).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Você tem os seguintes direitos garantidos pela LGPD:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Confirmação</strong> - Confirmar que tratamos seus dados
              </li>
              <li>
                <strong>Acesso</strong> - Solicitar uma cópia dos seus dados
              </li>
              <li>
                <strong>Correção</strong> - Solicitar correção de dados incompletos ou incorretos
              </li>
              <li>
                <strong>Anonimização</strong> - Solicitar anonimização de dados
              </li>
              <li>
                <strong>Eliminação</strong> - Solicitar exclusão de dados (direito ao esquecimento)
              </li>
              <li>
                <strong>Portabilidade</strong> - Receber seus dados em formato legível
              </li>
              <li>
                <strong>Revogação</strong> - Revogar consentimento a qualquer momento
              </li>
            </ul>
            <p className="text-slate-600 dark:text-slate-400 mt-4">
              Para exercer qualquer desses direitos, entre em contato: suporte@venceja.com.br
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">7. Segurança</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Implementamos medidas de segurança técnicas e administrativas para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li>Criptografia em trânsito (SSL/TLS)</li>
              <li>Criptografia em repouso</li>
              <li>Autenticação segura</li>
              <li>Acesso restrito a funcionários autorizados</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">8. Cookies</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Usamos cookies para melhorar sua experiência:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>Essenciais</strong> - Necessários para o funcionamento do Serviço</li>
              <li><strong>Funcional</strong> - Lembrar suas preferências</li>
              <li><strong>Analytics</strong> - Analisar uso do Serviço</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-400 mt-4">
              Você pode desativar cookies nas configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">9. Transferência Internacional</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Seus dados podem ser transferidos para servidores fora do Brasil. Quando isso ocorre, garantimos que a transferência esteja em conformidade com a LGPD e que medidas adequadas de proteção estejam em vigor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">10. Dados de Menores</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Nosso Serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados pessoais de menores. Se você acredita que coletamos dados de um menor, entre em contato imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">11. Alterações a esta Política</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Podemos atualizar esta Política periodicamente. Notificaremos sobre alterações significativas por email ou através do Serviço. A versão mais recente estará sempre disponível nesta página.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">12. Contato - DPO</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>Email:</strong> suporte@venceja.com.br</li>
              <li><strong>Responsável:</strong> VenceJa Tecnologia LTDA</li>
            </ul>
          </section>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Home
              </Button>
            </Link>
            <Link href="/termos">
              <Button variant="ghost">
                Ver Termos de Uso
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}