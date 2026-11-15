import type { SessionRecord } from '@app/core';
import { crewMember } from '../../app/hooks';
import { useMessages } from '../../i18n';
import { provisionalMessages } from '../../i18n/provisional';

/** PROVISIONAL: shows what goes here until `features/assistant` provides the real panel. */
export function AssistantPanel({ record }: { record: SessionRecord | null }) {
  const t = useMessages(provisionalMessages);
  return (
    <div className="placeholder">
      <p className="placeholder__tag">{t('tag')}</p>
      <p>{t('assistant.what')}</p>
      <p>
        {record
          ? t('assistant.record', { name: crewMember(record.crewId).name, day: record.flightDay })
          : t('assistant.noRecord')}
      </p>
    </div>
  );
}
