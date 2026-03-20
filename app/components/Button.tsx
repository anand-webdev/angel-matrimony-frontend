import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variantCls: Record<Variant, string> = {
  primary:
    'bg-primary text-white font-semibold hover:bg-primary-dark shadow-sm disabled:opacity-60 disabled:cursor-not-allowed',
  secondary:
    'border-2 border-border text-text-secondary font-medium hover:border-primary hover:text-primary bg-transparent',
  ghost:
    'text-primary font-medium hover:underline bg-transparent',
};

const sizeCls: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-1.5',
        variantCls[variant],
        sizeCls[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
