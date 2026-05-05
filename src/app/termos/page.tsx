'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Scroll } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermosPage() {
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
              <Scroll className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extralight">Termos de Uso</h1>
              <p className="text-slate-500">Última atualização: Janeiro 2025</p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">1. Introdução</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Bem-vindo ao VenceJa! Estes Termos de Uso (&quot;Termos&quot;) regem o uso do nosso aplicativo web de gestão empresarial, disponível em www.venceja.com.br (o &quot;Serviço&quot;).
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Ao acessar ou usar o VenceJa, você concorda em cumprir estes Termos. Se você não concordar com任何 parte destes Termos, não poderá usar nosso Serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">2. Definições</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Para os fins destes Termos, os seguintes termos têm os significados definidos abaixo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>&quot;Serviço&quot;</strong> - O aplicativo VenceJa e todas as suas funcionalidades</li>
              <li><strong>&quot;Usuário&quot;</strong> - Qualquer pessoa que acessa ou usa o Serviço</li>
              <li><strong>&quot;Conta&quot;</strong> - A conta registrada do Usuário no VenceJa</li>
              <li><strong>&quot;Plano Gratuito&quot;</strong> - O plano de uso gratuito do Serviço</li>
              <li><strong>&quot;Plano Pro&quot;</strong> - O plano pago de assinatura do Serviço</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">3. Aceitação dos Termos</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Ao criar uma Conta ou usar o Serviço, você confirma que leu, compreendeu e concorda em ficar vinculado a estes Termos e à nossa Política de Privacidade. Se você está acessando o Serviço em nome de uma empresa, você declara que tem autoridade para vincular essa empresa aos Termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">4. Elegibilidade</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Você deve ter pelo menos 18 anos de idade para usar o Serviço. Ao usar o Serviço, você declara e garante que tem pelo menos 18 anos de idade e que tem capacidade legal para celebrar estes Termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">5. Conta do Usuário</h2>
            
            <h3 className="text-lg font-light mb-2">5.1 Registro</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Para usar o Serviço, você precisa criar uma Conta fornecendo informações verdadeiras, precisas e completas. Você é responsável por manter suas informações de conta atualizadas.
            </p>

            <h3 className="text-lg font-light mb-2">5.2 Segurança</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua Conta. Você concorda em notifyarnos imediatamente sobre qualquer uso não autorizado de sua Conta.
            </p>

            <h3 className="text-lg font-light mb-2">5.3 Credenciais</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Suas credenciais são pessoais e intransferíveis. Você não pode compartilhar sua Conta com terceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">6. Serviços Oferecidos</h2>
            
            <h3 className="text-lg font-light mb-2">6.1 Plano Gratuito</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              O Plano Gratuito oferece: até 3 clientes, 10 cobranças, dashboard inteligente, score de clientes, ranking de inadimplentes, calendário financeiro, suporte por email, cobranças recorrentes e pagamento parcial.
            </p>

            <h3 className="text-lg font-light mb-2">6.2 Plano Pro</h3>
            <p className="text-slate-600 dark:text-slate-400">
              O Plano Pro oferece: clientes ilimitados, cobranças ilimitadas, cobrança via WhatsApp, relatórios completos, exportação CSV, suporte prioritário e tudo do Plano Gratuito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">7. Pagamento e Assinatura</h2>
            
            <h3 className="text-lg font-light mb-2">7.1 Taxas</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              O Plano Pro tem custo de R$ 49,90/mês ou R$ 499,00/ano (equivalente a R$ 41,58/mês). As taxas são cobradas automaticamente via cartão de crédito, PIX ou boleto.
            </p>

            <h3 className="text-lg font-light mb-2">7.2 Renovação</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Sua assinatura será renovada automaticamente a cada ciclo de cobrança, a menos que você cancele antes do renewal.
            </p>

            <h3 className="text-lg font-light mb-2">7.3 Reembolso</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Oferecemos reembolso integral em até 7 dias após a compra. Após esse período, não oferecemos reembolso, exceto em casos de falha técnica comprovada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">8. Uso Aceitável</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Você concorda em NÃO usar o Serviço para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li>Violar qualquer lei ouregulation aplicável</li>
              <li>Infringir direitos de terceiros</li>
              <li>Enviar spam ou mensagens indesejadas</li>
              <li>Introduzir vírus ou código malicioso</li>
              <li>Coletar dados de outros Usuários sem autorização</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">9. Propriedade Intelectual</h2>
            <p className="text-slate-600 dark:text-slate-400">
              O Serviço e todo o seu conteúdo, funcionalidades e tecnologia são de propriedade exclusiva do VenceJa e são protegidos por leis de direitos autorais, marcas e outras leis de propriedade intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">10. Privacidade</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Sua privacidade é importante para nós. Nossa Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais. Ao usar o Serviço, você concorda com a coleta e uso de informações de acordo com nossa Política de Privacidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">11. Isenção de Garantia</h2>
            <p className="text-slate-600 dark:text-slate-400">
              O SERVIÇO É FORNECIDO &quot;COMO ESTÁ&quot; E &quot;COMO DISPONÍVEL&quot;. O VENCEJA NÃO OFERECE GARANTIAS DE NENHUM TIPO, EXPRESSAS OU IMPLÍCITAS, QUANTO À QUALIDADE, PRECISÃO OU DISPONIBILIDADE DO SERVIÇO.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">12. Limitação de Responsabilidade</h2>
            <p className="text-slate-600 dark:text-slate-400">
              EM NENHUM CASO O VENCEJA SERÁ RESPONSÁVEL POR QUAISQUER DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, EXEMPLARES OU CONSEQUENCIAIS DECORRENTES DO USO OU INCAPACIDADE DE USAR O SERVIÇO.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">13. Indenização</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Você concorda em defender, indenizar e isentar o VenceJa e seus oficiais, diretores e funcionários de qualquer reclamação ou demanda feita por terceiros devido ou decorrente de sua violação destes Termos ou seu uso do Serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">14. Rescisão</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Podemos rescindir ou suspender sua Conta a qualquer momento, por qualquer motivo, sem aviso prévio. Você pode cancelar sua Conta a qualquer momento através das configurações do aplicativo ou entrando em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">15. Lei Aplicável</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Estes Termos serão regidos e interpretados de acordo com as leis brasileiras. Qualquer disputa decorrente destes Termos será resolvida no foro da comarca de São Paulo, SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-light mb-4">16. Contato</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mt-4">
              <li>Email: suporte@venceja.com.br</li>
            </ul>
          </section>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}