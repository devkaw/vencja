'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark';

// The <html> class is the source of truth (set before paint by the root layout script).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
const getServerSnapshot = (): Theme => 'light';

export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be blocked; the toggle still works for this visit.
    }

    const root = document.documentElement;
    const apply = () => root.classList.toggle('dark', next === 'dark');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      apply();
      return;
    }

    if (!document.startViewTransition) {
      root.classList.add('theme-fading');
      apply();
      window.setTimeout(() => root.classList.remove('theme-fading'), 550);
      return;
    }

    // The new theme spreads out as a circle from the button that was pressed.
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 750, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      })
      .catch(() => {});
  };

  const label = theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center gap-3 rounded-xl text-ink-3 transition-[color,background-color,transform] duration-200 hover:scale-110 hover:bg-ink/5 hover:text-ink active:scale-90',
        withLabel ? 'h-10 w-full px-3 text-sm font-medium' : 'size-10 justify-center',
        className
      )}
      aria-label={label}
      title={label}
    >
      <span className="relative size-[18px]">
        <Sun className={cn('absolute inset-0 size-[18px] transition-all duration-300', theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0')} />
        <Moon className={cn('absolute inset-0 size-[18px] transition-all duration-300', theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0')} />
      </span>
      {withLabel && <span>{theme === 'light' ? 'Tema escuro' : 'Tema claro'}</span>}
    </button>
  );
}
