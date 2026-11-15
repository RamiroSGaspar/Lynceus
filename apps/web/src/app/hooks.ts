import { useEffect, useMemo } from 'react';
import { PRODUCT, type CrewId, type CrewMember, type SessionRecord } from '@app/core';
import { CREW, getHistory } from './core';
import { mergeHistory } from './history';
import { useAppState } from './StoreContext';

export function crewMember(crewId: CrewId): CrewMember {
  const member = CREW.find((candidate) => candidate.id === crewId);
  if (!member) throw new Error(`Unknown crew member ${crewId}`);
  return member;
}

/**
 * The history shown for a crew member on the chosen mission day: what comes with
 * the application before that day, plus the controls done in this browser.
 */
export function useCrewHistory(crewId: CrewId): SessionRecord[] {
  const { missionDay, records } = useAppState();
  return useMemo(
    () => mergeHistory(getHistory(crewId, missionDay), records, crewId, missionDay),
    [crewId, missionDay, records],
  );
}

/** Names the browser tab after the screen. The product name comes from the core, as everywhere. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${PRODUCT.name}`;
  }, [title]);
}
