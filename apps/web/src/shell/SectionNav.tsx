import type { CrewId, SessionRecord } from '@app/core';
import { findRecord } from '../app/history';
import { useCrewHistory } from '../app/hooks';
import { formatRoute, type Route } from '../app/routes';
import { useAppState } from '../app/StoreContext';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { AssistantPanel } from '../slots';
import { Icon, type IconName } from '../ui';

export type Section = 'control' | 'result' | 'history' | 'report';

interface Props {
  crewId: CrewId;
  /** Where the screen is, or null when it is none of the four. */
  current: Section | null;
  /** The control the screen is about. Absent: today's control when it is done, else the most recent one. */
  flightDay?: number;
  /** The result the assistant is asked about, or null when no result is open. */
  record: SessionRecord | null;
}

function Destination({ to, icon, current, children }: { to: Route | null; icon: IconName; current: boolean; children: string }) {
  const content = (
    <>
      <span className="co-accion__icono">
        <Icon name={icon} />
      </span>
      {children}
    </>
  );
  // A destination that does not exist yet is said, not hidden: dashed, like everything that is not firm.
  if (!to) {
    return (
      <span className="co-accion is-ausente" aria-disabled="true">
        {content}
      </span>
    );
  }
  return (
    <a className="co-accion" href={formatRoute(to)} aria-current={current ? 'page' : undefined}>
      {content}
    </a>
  );
}

/**
 * The navigation: at the bottom and in the centre, over a halo. Four destinations of the crew
 * member on screen and, apart, the assistant. They are links to the routes that exist: a disc
 * with its icon and a word in capitals. It appears once a crew member is chosen, and it is
 * hidden during a vision test: nothing floats over the stimulus.
 */
export function SectionNav({ crewId, current, flightDay, record }: Props) {
  const t = useMessages(appMessages);
  const { missionDay } = useAppState();
  const history = useCrewHistory(crewId);
  const day = flightDay ?? (findRecord(history, missionDay) ?? history.at(-1))?.flightDay ?? null;
  return (
    <nav className="co-nav co-nav--fija co-halo no-print" aria-label={t('header.context')}>
      <Destination to={{ name: 'session', crewId }} icon="scan-eye" current={current === 'control'}>
        {t('nav.control')}
      </Destination>
      <Destination to={day === null ? null : { name: 'result', crewId, flightDay: day }} icon="anillo" current={current === 'result'}>
        {t('nav.result')}
      </Destination>
      <Destination to={{ name: 'history', crewId }} icon="chart-line" current={current === 'history'}>
        {t('nav.history')}
      </Destination>
      <Destination to={day === null ? null : { name: 'report', crewId, flightDay: day }} icon="file-text" current={current === 'report'}>
        {t('nav.report')}
      </Destination>
      <span className="co-nav__separador" aria-hidden="true" />
      <AssistantPanel record={record} compact />
    </nav>
  );
}
