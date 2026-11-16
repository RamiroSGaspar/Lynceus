import { useMessages } from '../../i18n';
import { octMessages } from './messages';

/** The strokes of the scans drawn on the eye: usable, not usable, and the one being taken or looked at. */
export function RadialLegend({ current = false }: { current?: boolean }) {
  const t = useMessages(octMessages);
  return (
    <ul className="co-leyenda">
      <li>
        <svg className="co-muestra" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
          <line className="co-radio is-tomado" x1="1" x2="27" y1="5" y2="5" />
        </svg>{' '}
        {t('legend.usable')}
      </li>
      <li>
        <svg className="co-muestra" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
          <line className="co-radio is-malo" x1="1" x2="27" y1="5" y2="5" />
        </svg>{' '}
        {t('legend.unusable')}
      </li>
      <li>
        <svg className="co-muestra" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
          <line className="co-radio is-actual" x1="1" x2="27" y1="5" y2="5" />
        </svg>{' '}
        {t(current ? 'legend.current' : 'legend.selected')}
      </li>
    </ul>
  );
}
