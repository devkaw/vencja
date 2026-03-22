import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { NotificationsChecker } from '@/components/notifications-checker';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <Sidebar profile={profile} />
      <div className="lg:pl-[280px] xl:pl-72 pt-14 sm:pt-0">
        <main className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <NotificationsChecker />
          {children}
        </main>
      </div>
    </div>
  );
}