'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProAccess, setHasProAccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, plano, is_admin, created_at, subscription_status')
        .eq('id', user.id)
        .single();

      setHasProAccess(hasPremiumAccess(profile as any));
      setIsLoading(false);
    }

    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="text-slate-400">Verificando status...</p>
      </div>
    );
  }

  if (hasProAccess) {
    return (
      <motion.div initial="initial" animate="animate" variants={fadeIn} className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl font-light mb-3">Pagamento Confirmado!</h1>
        <p className="text-slate-400 mb-8">
          Seu Plano Pro está ativo e você agora tem acesso a todos os recursos premium.
        </p>
        <Link href="/dashboard">
          <Button className="bg-accent text-black w-full">
            Acessar Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={fadeIn} className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-10 h-10 text-yellow-500" />
      </div>
      <h1 className="text-3xl font-light mb-3">Aguardando Confirmação</h1>
      <p className="text-slate-400 mb-4">
        Seu pagamento foi recebido e está sendo processado. Você receberá um email em breve confirmando a ativação.
      </p>
      <p className="text-slate-500 text-sm mb-8">
        O processo leva poucos minutos. Se tiver dúvidas, entre em contato conosco.
      </p>
      <Link href="/dashboard">
        <Button variant="outline" className="w-full">
          Voltar ao Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}