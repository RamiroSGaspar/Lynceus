import type { Orientation } from '@app/core/vision/index';
import { useEffect } from 'react';
import { useMessages } from '../../i18n';
import { acuityMessages } from './messages';

/** Numeric keypad layout: 7 8 9 / 4 · 6 / 1 2 3. Cells read row by row. */
const PAD: readonly (Orientation | null)[] = [3, 2, 1, 4, null, 0, 5, 6, 7];

const BY_CODE: Readonly<Record<string, Orientation>> = {
  Numpad6: 0,
  Numpad9: 1,
  Numpad8: 2,
  Numpad7: 3,
  Numpad4: 4,
  Numpad1: 5,
  Numpad2: 6,
  Numpad3: 7,
  ArrowRight: 0,
  ArrowUp: 2,
  ArrowLeft: 4,
  ArrowDown: 6,
};

const BY_KEY: Readonly<Record<string, Orientation>> = {
  '6': 0,
  '9': 1,
  '8': 2,
  '7': 3,
  '4': 4,
  '1': 5,
  '2': 6,
  '3': 7,
};

/** Forced choice among eight directions: keyboard (arrows, numeric keypad) and eight large buttons. No "I cannot see". */
export function ResponsePad({ onAnswer }: { onAnswer(orientation: Orientation): void }) {
  const t = useMessages(acuityMessages);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const orientation = BY_CODE[event.code] ?? BY_KEY[event.key];
      if (orientation === undefined) return;
      event.preventDefault();
      onAnswer(orientation);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAnswer]);

  return (
    <div className="vt-pad" role="group" aria-label={t('responses')}>
      {PAD.map((orientation, index) =>
        orientation === null ? (
          <span key={index} aria-hidden="true" />
        ) : (
          <button
            key={index}
            type="button"
            className="vt-pad__button"
            aria-label={t(`dir.${orientation}`)}
            onClick={() => onAnswer(orientation)}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false">
              <g transform={`rotate(${-orientation * 45} 12 12)`}>
                <path d="M4 12h13M12 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </button>
        ),
      )}
    </div>
  );
}
