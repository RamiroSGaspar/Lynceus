import { useLayoutEffect, useRef } from 'react';
import { PRODUCT, type CrewId } from '@app/core';
import { CORE_IS_PROVISIONAL } from '../app/core';
import { crewMember } from '../app/hooks';
import { formatRoute } from '../app/routes';
import { useAppState } from '../app/StoreContext';
import { useI18n, useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { commonMessages } from '../i18n/common';
import { Button, LanguageToggle, SimulatedNotice } from '../ui';

interface Props {
  /** The crew member the current screen is about, or the last one chosen. */
  crewId: CrewId | null;
  assistantOpen: boolean;
  onToggleAssistant: () => void;
}

/** The same on every screen: product, crew member, mission day, language and the simulated-data notice. */
export function AppHeader({ crewId, assistantOpen, onToggleAssistant }: Props) {
  const { locale } = useI18n();
  const t = useMessages(appMessages);
  const tc = useMessages(commonMessages);
  const { missionDay } = useAppState();
  const member = crewId ? crewMember(crewId) : null;

  // The page needs the real heights of the two bars: to let the header scroll away on a small
  // screen while the notice stays, and to keep a focused element clear of whatever stays.
  const headerRef = useRef<HTMLElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    const notice = noticeRef.current;
    if (!header || !notice || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const apply = (): void => {
      root.style.setProperty('--app-header-height', `${header.offsetHeight}px`);
      root.style.setProperty('--app-notice-height', `${notice.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    observer.observe(notice);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-top">
      <header ref={headerRef} className="app-header">
        <div className="app-header__inner">
          <a
            className="app-header__brand"
            href={formatRoute({ name: 'home' })}
            aria-label={t('header.home', { product: PRODUCT.name })}
          >
            {PRODUCT.name}
          </a>
          <dl className="app-header__context" aria-label={t('header.context')}>
            <div className="app-header__item">
              <dt>{t('header.crew')}</dt>
              <dd>
                {member ? (
                  <>
                    {member.name}
                    <span className="app-header__role"> · {member.role[locale]}</span>
                  </>
                ) : (
                  t('header.crew.none')
                )}
              </dd>
            </div>
            <div className="app-header__item">
              <dt>{t('header.missionDay')}</dt>
              <dd>{tc('flightDay', { day: missionDay })}</dd>
            </div>
          </dl>
          <Button
            id="assistant-toggle"
            className="app-header__assistant"
            variant="ghost"
            aria-expanded={assistantOpen}
            aria-controls="assistant-panel"
            onClick={onToggleAssistant}
          >
            {t('assistant.toggle')}
          </Button>
          <div className="app-header__language">
            <LanguageToggle />
          </div>
        </div>
      </header>
      <div ref={noticeRef} className="app-notice">
        <SimulatedNotice />
        {CORE_IS_PROVISIONAL && (
          <p className="app-notice__provisional" role="note">
            {t('provisional.rules')}
          </p>
        )}
      </div>
    </div>
  );
}
