import { alertForLevel, type Level } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useMessages } from '../i18n';
import { LevelShape, type LevelKind } from './LevelShape';

/** The design-system kind of a level: its alert class, or `unmeasured` when there is no result. */
export function levelKind(level: Level | null): LevelKind {
  return level === null ? 'unmeasured' : alertForLevel(level);
}

interface Props {
  /** `null` means the eye, or the control, could not be measured. */
  level: Level | null;
  /** `lg` goes once per screen, in the answer: shape and class above, the name under them. */
  size?: 'md' | 'lg';
}

/**
 * A level, said three ways at once: colour, shape and words. No box: over black, the coloured
 * shape stands on its own. "No detectable change" and "could not be measured" carry no alert
 * class, and neither is green: it is what the instrument can see, not good news guaranteed.
 */
export function LevelBadge({ level, size = 'md' }: Props) {
  const t = useMessages(commonMessages);
  const kind = levelKind(level);
  const label = level === null ? t('level.not-measured') : t(`level.${level}`);
  const alertLabel = kind === 'none' || kind === 'unmeasured' ? null : t(`alert.${kind}`);
  return (
    <span className={`co-nivel co-nivel--${kind}${size === 'lg' ? ' co-nivel--lg' : ''}`}>
      <LevelShape kind={kind} className="co-nivel__forma" />
      {alertLabel && <span className="co-nivel__clase">{alertLabel}</span>}
      <span className="co-nivel__nombre">{label}</span>
    </span>
  );
}
