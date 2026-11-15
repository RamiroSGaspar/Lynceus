import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
}

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  return <button type={type} className={`btn btn--${variant} btn--${size} ${className}`.trim()} {...rest} />;
}
