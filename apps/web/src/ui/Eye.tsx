import type { Eye, Level } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useMessages } from '../i18n';
import { levelKind } from './LevelBadge';

/** Which eye what follows is about: its abbreviation in a tag, and its name. */
export function EyeTag({ eye }: { eye: Eye }) {
  const t = useMessages(commonMessages);
  return (
    <span className="co-ojo">
      <abbr className="co-ficha" title={t(`eye.${eye}`)}>
        {t(`eye.${eye}.short`)}
      </abbr>
      {t(`eye.${eye}`)}
    </span>
  );
}

const EYES: readonly Eye[] = ['OD', 'OS'];

/**
 * The state of both eyes of a person at a glance: two small discs, each with the ring of its
 * level. The right eye on the left, as in clinical reports. Never alone: next to it goes the
 * level of the control with its shape and its word. `null` is an eye that could not be measured.
 */
export function EyePair({ levels }: { levels: Readonly<Record<Eye, Level | null>> }) {
  const t = useMessages(commonMessages);
  const name = (level: Level | null): string => (level === null ? t('level.not-measured') : t(`level.${level}`));
  return (
    <span className="co-par" role="img" aria-label={EYES.map((eye) => `${t(`eye.${eye}`)}: ${name(levels[eye])}.`).join(' ')}>
      {EYES.map((eye) => (
        <span key={eye} className={`co-par__ojo co-par__ojo--${levelKind(levels[eye])}`}>
          <span className="co-par__disco" />
          {t(`eye.${eye}.short`)}
        </span>
      ))}
    </span>
  );
}
