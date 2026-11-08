import { cn } from '@/lib/utils';

const palettes = [
  'bg-brand-soft text-brand-ink',
  'bg-[#E6ECFE] text-[#3346B8] dark:bg-[#1C2550] dark:text-[#A9B8FF]',
  'bg-[#FDEBD7] text-[#9A4D09] dark:bg-[#3D2810] dark:text-[#F7C27A]',
  'bg-[#F3E5FB] text-[#7A2E9E] dark:bg-[#33173F] dark:text-[#D9A6F2]',
  'bg-[#FCE4E6] text-[#A32637] dark:bg-[#3F1519] dark:text-[#F5A3AC]',
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const sizes = {
  sm: 'size-8 text-xs rounded-lg',
  md: 'size-10 text-sm rounded-xl',
  lg: 'size-12 text-base rounded-2xl',
  xl: 'size-16 text-xl rounded-2xl',
};

export function Avatar({ name, size = 'md', className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 select-none items-center justify-center font-semibold transition-transform duration-300 ease-spring group-hover:scale-110', palettes[hash(name || '?') % palettes.length], sizes[size], className)}
      aria-hidden
    >
      {initials(name || '?')}
    </span>
  );
}
