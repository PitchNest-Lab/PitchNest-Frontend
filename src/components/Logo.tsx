import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const SIZES = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
} as const;

type LogoSize = keyof typeof SIZES;

type LogoMarkProps = {
  size?: LogoSize;
  className?: string;
};

export function LogoMark({ size = 'md', className }: LogoMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="PitchNest"
      className={cn(SIZES[size], 'shrink-0 rounded-full object-cover', className)}
    />
  );
}

type LogoProps = LogoMarkProps & {
  showText?: boolean;
  textClassName?: string;
  className?: string;
};

export function Logo({ size = 'md', showText = false, className, textClassName }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark size={size} />
      {showText && (
        <span
          className={cn(
            'font-display font-semibold tracking-tight text-slate-900 dark:text-zinc-100',
            size === 'sm' && 'text-base',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-xl',
            size === 'xl' && 'text-2xl',
            textClassName,
          )}
        >
          PitchNest
        </span>
      )}
    </div>
  );
}

type LogoLinkProps = LogoProps & {
  to?: string;
};

export function LogoLink({ to = '/', ...props }: LogoLinkProps) {
  return (
    <Link to={to} className="hover:opacity-90 transition-opacity w-fit">
      <Logo {...props} />
    </Link>
  );
}
