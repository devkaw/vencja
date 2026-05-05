'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(saved === 'true');
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setReady(true);
    }
    load();
  }, []);

  const toggleCollapsed = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem('sidebar-collapsed', String(newVal));
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-20" />
      <Sidebar profile={profile} collapsed={collapsed} onToggle={toggleCollapsed} />
      <div className={collapsed ? 'lg:pl-16' : 'lg:pl-64'}>
        <main className="p-4 sm:p-6 lg:p-6 ml-16 lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}