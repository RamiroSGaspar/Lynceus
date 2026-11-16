/**
 * The image behind a result, before the viewer is opened: the fundus of each eye as an
 * ocular, with what the engine measured drawn on it with the engine's own geometry, and
 * one scan with its edges. Both are generated again from the request of the accepted
 * capture, in the worker; the numbers are the ones saved with the control.
 */
import type { CaptureRequest, ExamSummary } from '@app/core';
import type { ReactNode } from 'react';
import { useMessages } from '../../i18n';
import { Action, BrandWorking, Group, type LevelKind } from '../../ui';
import { fundusWindow } from './FundusCanvas';
import { ringPlacement } from './geometry';
import { octMessages } from './messages';
import { Ocular, RingMarks, guideStart } from './Ocular';
import { useExamPreview } from './preview';
import { ScanFigure, StrokeLegend } from './ScanFigure';

interface OcularProps {
  /** The request of the capture the engine accepted, or null when the exam was not measured on an image. */
  request: CaptureRequest | null;
  /** The exam the numbers come from: its ellipse places the rings. */
  exam: ExamSummary | null;
  /** The pre-flight exam of the eye: its shape is the one the rings were placed with. */
  baseline?: ExamSummary | null;
  level: LevelKind | null;
  selected?: boolean;
  onSelect?: () => void;
  head?: ReactNode;
  foot?: ReactNode;
  /** Said inside the disc when there is no image to show: why. */
  empty?: ReactNode;
}

/** The ocular of one eye of a result. While the image is generated the brand sweeps in its place. */
export function ExamOcular({ request, exam, baseline, level, selected, onSelect, head, foot, empty }: OcularProps) {
  const t = useMessages(octMessages);
  const state = useExamPreview(request);
  const preview = state.status === 'ready' ? state.preview : null;
  const placement = exam ? ringPlacement(exam, baseline) : null;
  const window = preview
    ? fundusWindow(preview.fundus, preview.scaleXMm, preview.scaleYMm, {
        x: (preview.scan.header.startXMm + preview.scan.header.endXMm) / 2,
        y: (preview.scan.header.startYMm + preview.scan.header.endYMm) / 2,
      })
    : null;
  const eyeName = t(`eyeName.${request?.eye ?? exam?.eye ?? 'OD'}`);
  const total = exam?.quality.totalScans ?? preview?.totalScans ?? 0;
  const label = exam
    ? [
        t('fundus.alt', { eye: eyeName, taken: total, total, unusable: total - exam.quality.usableScans }),
        placement ? t('fundus.alt.ellipse') : '',
      ]
        .filter(Boolean)
        .join(' ')
    : t('fundus.title');
  return (
    <Ocular
      level={level}
      selected={selected}
      onSelect={onSelect}
      label={label}
      head={head}
      foot={foot}
      image={preview && window ? { fundus: preview.fundus, scaleXMm: preview.scaleXMm, scaleYMm: preview.scaleYMm, window } : null}
      marks={placement && window ? <RingMarks ellipse={placement.ellipse} window={window} /> : null}
      guide={placement && window && foot ? guideStart(placement.ellipse, window) : null}
      working={state.status === 'loading'}
      empty={empty}
    />
  );
}

/** The strokes drawn on the ocular: the opening, the measured band and the outer ring limits. */
export function OcularLegend() {
  return <StrokeLegend keys={['opening', 'zone', 'rings']} />;
}

/** One scan of the exam with its edges, as the second evidence of a result, with what follows it. */
export function ExamScan({ request, onOpenViewer }: { request: CaptureRequest | null; onOpenViewer?: () => void }) {
  const t = useMessages(octMessages);
  const state = useExamPreview(request);
  if (!request || state.status === 'idle' || state.status === 'failed') return null;
  const preview = state.status === 'ready' ? state.preview : null;
  return (
    <Group icon="corte" title={t('scan.title', { n: (preview?.scan.index ?? 0) + 1, total: preview?.totalScans ?? 48 })}>
      {preview ? (
        <ScanFigure frame={preview.scan} total={preview.totalScans} />
      ) : (
        <div className="co-corte__espera" role="status" aria-label={t('scan.waiting')}>
          <BrandWorking size="sm" />
        </div>
      )}
      {onOpenViewer && (
        <Action icon="layers" onClick={onOpenViewer}>
          {t('accepted.viewer')}
        </Action>
      )}
    </Group>
  );
}
