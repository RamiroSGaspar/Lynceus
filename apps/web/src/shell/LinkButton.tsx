import type { AnchorHTMLAttributes } from 'react';
import { formatRoute, type Route } from '../app/routes';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: Route;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
}

/** A link to another screen that looks like a button. It is a real link: it can be opened in a new tab. */
export function LinkButton({ to, variant = 'secondary', size = 'md', className = '', ...rest }: Props) {
  return <a href={formatRoute(to)} className={`btn btn--${variant} btn--${size} ${className}`.trim()} {...rest} />;
}
