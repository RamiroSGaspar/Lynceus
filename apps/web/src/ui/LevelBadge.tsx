import { alertForLevel, type Level } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useMessages } from '../i18n';
import { AlertIcon } from './AlertIcon';

/** A level, said three ways at once: colour, shape and words. `null` means the eye could not be measured. */
export function LevelBadge({ level, size = 'md' }: { level: Level | null; size?: 'md' | 'lg' }) {
  const t = useMessages(commonMessages);
  const alert = alertForLevel(level);
  const label = level === null ? t('level.not-measured') : t(`level.${level}`);
  const alertLabel = alert === 'none' ? null : t(`alert.${alert}`);
  return (
    <span className={`level-badge level-badge--${alert} level-badge--${size}${level === null ? ' level-badge--unmeasured' : ''}`}>
      <AlertIcon alert={alert} size={size === 'lg' ? 28 : 20} />
      <span className="level-badge__text">
        {alertLabel && <span className="level-badge__class">{alertLabel}</span>}
        <span className="level-badge__label">{label}</span>
      </span>
    </span>
  );
}
