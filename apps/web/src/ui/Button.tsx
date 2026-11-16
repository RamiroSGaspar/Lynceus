import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/**
 * `primary`: white fill, black text. One per view: the next step.
 * `secondary`: thin edge over black. `ghost`: something secondary that opens or leaves,
 * drawn as an action: a disc with its icon and a word.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

interface Look {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the words. A `ghost` button always has one: `chevron-right` when none is given. */
  icon?: IconName;
  /** Icon after the words: the arrow of something that moves on. */
  iconEnd?: IconName;
}

export function buttonClass(variant: ButtonVariant, size: ButtonSize, className = ''): string {
  const base =
    variant === 'ghost'
      ? 'co-accion co-accion--sm'
      : `co-boton${variant === 'primary' ? ' co-boton--principal' : ''}${size === 'lg' ? ' co-boton--lg' : ''}`;
  return className ? `${base} ${className}` : base;
}

/** What goes inside a button or a link that looks like one: icons and words in their places. */
export function ButtonContent({ variant = 'secondary', icon, iconEnd, children }: Look & { children?: ReactNode }) {
  if (variant === 'ghost') {
    return (
      <>
        <span className="co-accion__icono">
          <Icon name={icon ?? 'chevron-right'} />
        </span>
        {children}
      </>
    );
  }
  return (
    <>
      {icon && <Icon name={icon} />}
      {children}
      {iconEnd && <Icon name={iconEnd} />}
    </>
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & Look;

/** Something that is touched: a rectangle with a thin edge, in spaced capitals. It says what happens on touching it. */
export function Button({ variant = 'secondary', size = 'md', icon, iconEnd, className = '', type = 'button', children, ...rest }: Props) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      <ButtonContent variant={variant} icon={icon} iconEnd={iconEnd}>
        {children}
      </ButtonContent>
    </button>
  );
}

interface ActionLook {
  icon: IconName;
  /** `sm`: a 36 px disc, inside a veil. Default: 44 px, what is touched. */
  size?: 'md' | 'sm';
  /** Filled disc: the main action, drawn like "where I am". */
  primary?: boolean;
  /** The words are only for assistive technology: the disc stands alone. */
  hideLabel?: boolean;
}

export function actionClass({ size = 'md', primary = false }: Pick<ActionLook, 'size' | 'primary'>, className = ''): string {
  return `co-accion${size === 'sm' ? ' co-accion--sm' : ''}${primary ? ' co-accion--principal' : ''}${className ? ` ${className}` : ''}`;
}

export function ActionContent({ icon, hideLabel = false, children }: Pick<ActionLook, 'icon' | 'hideLabel'> & { children?: ReactNode }) {
  return (
    <>
      <span className="co-accion__icono">
        <Icon name={icon} />
      </span>
      {hideLabel ? <span className="co-oculto">{children}</span> : children}
    </>
  );
}

/** A disc with its icon and a word in capitals: how something is opened without leaving the screen. */
export function Action({ icon, size, primary, hideLabel, className = '', type = 'button', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & ActionLook) {
  return (
    <button type={type} className={actionClass({ size, primary }, className)} {...rest}>
      <ActionContent icon={icon} hideLabel={hideLabel}>
        {children}
      </ActionContent>
    </button>
  );
}

/** The same piece as a link: a destination, or a place further down the page. */
export function ActionLink({ icon, size, primary, hideLabel, className = '', children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & ActionLook) {
  return (
    <a className={actionClass({ size, primary }, className)} {...rest}>
      <ActionContent icon={icon} hideLabel={hideLabel}>
        {children}
      </ActionContent>
    </a>
  );
}
