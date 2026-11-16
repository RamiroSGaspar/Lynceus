import type { AnchorHTMLAttributes } from 'react';
import { formatRoute, type Route } from '../app/routes';
import { ActionLink, ButtonContent, buttonClass, type ButtonSize, type ButtonVariant, type IconName } from '../ui';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: Route;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconEnd?: IconName;
}

/** A link to another screen that looks like a button. It is a real link: it can be opened in a new tab. */
export function LinkButton({ to, variant = 'secondary', size = 'md', icon, iconEnd, className = '', children, ...rest }: Props) {
  return (
    <a href={formatRoute(to)} className={buttonClass(variant, size, className)} {...rest}>
      <ButtonContent variant={variant} icon={icon} iconEnd={iconEnd}>
        {children}
      </ButtonContent>
    </a>
  );
}

interface ActionProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: Route;
  icon: IconName;
  size?: 'md' | 'sm';
  hideLabel?: boolean;
}

/** A link to another screen drawn as an action: a disc with its icon and a word in capitals. */
export function LinkAction({ to, ...rest }: ActionProps) {
  return <ActionLink href={formatRoute(to)} {...rest} />;
}
