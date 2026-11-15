import type { AmslerMarkKind, AmslerResult, Eye, ScreenCalibration } from '@app/core';
import {
  AMSLER_CELL_DEG,
  AMSLER_MARK_KINDS,
  AMSLER_MAX_GRID,
  amslerCellMm,
  amslerFieldDeg,
  amslerGridSizeThatFits,
  summarizeAmsler,
  type AmslerMark,
} from '@app/core/vision/index';
import { useState } from 'react';
import { commonMessages } from '../../i18n/common';
import { useI18n, useMessages } from '../../i18n';
import { Button, Card, OriginTag } from '../../ui';
import { AmslerGrid, type AmslerTool } from './AmslerGrid';
import { Calibration } from './Calibration';
import { ChoiceGroup } from './ChoiceGroup';
import { FocusHeading } from './FocusHeading';
import { amslerMessages, visionMessages } from './messages';
import { useDevicePixelRatio } from './useDevicePixelRatio';
import './vision.css';

interface Props {
  calibration: ScreenCalibration | null;
  onComplete(result: { OD: AmslerResult; OS: AmslerResult }): void;
  onSkip(): void;
}

const EYES: readonly Eye[] = ['OD', 'OS'];
const OTHER: Readonly<Record<Eye, Eye>> = { OD: 'OS', OS: 'OD' };
/** Room kept around the grid so it fits in the window without scrolling, CSS pixels. */
const MARGIN_CSS = 64;

type Phase =
  | { kind: 'calibrate' }
  | { kind: 'intro' }
  | { kind: 'eye-intro'; eye: Eye }
  | { kind: 'corners'; eye: Eye }
  | { kind: 'mark'; eye: Eye }
  | { kind: 'summary' };

interface Layout {
  gridSize: number;
  cellMm: number;
  cellCss: number;
  fieldDeg: number;
}

/** Largest even grid of 1° squares that fits in the window, from the calibration. */
function layoutFor(calibration: ScreenCalibration, devicePixelRatio: number): Layout {
  const cellMm = amslerCellMm(calibration.viewingDistanceCm, AMSLER_CELL_DEG);
  const cssPerMm = calibration.pxPerMm / devicePixelRatio;
  const availableCss = Math.min(document.documentElement.clientWidth, window.innerHeight) - MARGIN_CSS;
  const gridSize = amslerGridSizeThatFits(availableCss / cssPerMm, cellMm);
  return {
    gridSize,
    cellMm,
    cellCss: cellMm * cssPerMm,
    fieldDeg: amslerFieldDeg(gridSize, cellMm, calibration.viewingDistanceCm),
  };
}

/** Amsler grid, one eye at a time, right eye first (spec 03, section 3). Draws no conclusion. */
export function AmslerStep({ calibration: given, onComplete, onSkip }: Props) {
  const t = useMessages(amslerMessages);
  const tv = useMessages(visionMessages);
  const tc = useMessages(commonMessages);
  const { formatNumber } = useI18n();
  const dpr = useDevicePixelRatio();
  const [calibration, setCalibration] = useState<ScreenCalibration | null>(given);
  const [phase, setPhase] = useState<Phase>(given ? { kind: 'intro' } : { kind: 'calibrate' });
  const [layout, setLayout] = useState<Layout | null>(() => (given ? layoutFor(given, dpr) : null));
  const [corners, setCorners] = useState<Partial<Record<Eye, boolean>>>({});
  const [marks, setMarks] = useState<readonly AmslerMark[]>([]);
  const [tool, setTool] = useState<AmslerTool>('wavy');
  const [results, setResults] = useState<Partial<Record<Eye, AmslerResult>>>({});
  const eyeName = (eye: Eye) => tv(`eyeName.${eye}`);
  const format1 = (value: number) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const finishEye = (eye: Eye, eyeMarks: readonly AmslerMark[]) => {
    if (!layout) return;
    const result = summarizeAmsler({
      eye,
      gridSize: layout.gridSize,
      cellDeg: AMSLER_CELL_DEG,
      marks: eyeMarks,
      cornersSeen: corners[eye] ?? false,
    });
    setResults((previous) => ({ ...previous, [eye]: result }));
    setMarks([]);
    setTool('wavy');
    setPhase(eye === 'OD' ? { kind: 'eye-intro', eye: 'OS' } : { kind: 'summary' });
  };

  let body;
  if (phase.kind === 'calibrate' || !calibration || !layout) {
    body = (
      <Calibration
        onDone={(stored) => {
          setCalibration(stored.calibration);
          setLayout(layoutFor(stored.calibration, stored.devicePixelRatio));
          setPhase({ kind: 'intro' });
        }}
      />
    );
  } else if (layout.gridSize === 0) {
    body = <p className="vt-caution">{t('tooSmall')}</p>;
  } else if (phase.kind === 'intro') {
    body = (
      <section className="vt-panel">
        <FocusHeading>{t('title')}</FocusHeading>
        <p className="vt-lead">{t('intro')}</p>
        <p>
          {t('size', { n: layout.gridSize, mm: formatNumber(layout.cellMm, { maximumFractionDigits: 2 }), field: format1(layout.fieldDeg) })}
        </p>
        {layout.gridSize < AMSLER_MAX_GRID && <p className="vt-caution">{t('size.small', { field: format1(layout.fieldDeg) })}</p>}
        <p className="vt-note">{t('contrast')}</p>
        <FixedTexts />
        <div className="vt-actions">
          <Button variant="primary" size="lg" onClick={() => setPhase({ kind: 'eye-intro', eye: 'OD' })}>
            {tc('action.continue')}
          </Button>
        </div>
      </section>
    );
  } else if (phase.kind === 'eye-intro') {
    body = (
      <section className="vt-panel">
        <FocusHeading>{t('eye.title', { eye: eyeName(phase.eye) })}</FocusHeading>
        <p className="vt-lead">{t('eye.cover', { other: eyeName(OTHER[phase.eye]) })}</p>
        <p>{t('fixate')}</p>
        <div className="vt-actions">
          <Button variant="primary" size="lg" onClick={() => setPhase({ kind: 'corners', eye: phase.eye })}>
            {t('eye.start')}
          </Button>
        </div>
      </section>
    );
  } else if (phase.kind === 'corners') {
    const eye = phase.eye;
    body = (
      <section className="vt-panel vt-amsler-panel" aria-label={t('eye.title', { eye: eyeName(eye) })}>
        <AmslerGrid gridSize={layout.gridSize} cellCss={layout.cellCss} marks={[]} />
        <FocusHeading level={3} preventScroll>
          {t('corners.question')}
        </FocusHeading>
        <p className="vt-note">{t('fixate')}</p>
        <div className="vt-actions">
          {(['yes', 'no'] as const).map((answer) => (
            <Button
              key={answer}
              size="lg"
              variant="primary"
              onClick={() => {
                setCorners((previous) => ({ ...previous, [eye]: answer === 'yes' }));
                setPhase({ kind: 'mark', eye });
              }}
            >
              {tv(answer)}
            </Button>
          ))}
        </div>
      </section>
    );
  } else if (phase.kind === 'mark') {
    const eye = phase.eye;
    const tools: AmslerTool[] = [...AMSLER_MARK_KINDS, 'erase'];
    body = (
      <section className="vt-panel vt-amsler-panel" aria-label={t('eye.title', { eye: eyeName(eye) })}>
        <AmslerGrid
          gridSize={layout.gridSize}
          cellCss={layout.cellCss}
          marks={marks}
          tool={tool}
          onChange={setMarks}
          onToolChange={setTool}
        />
        <h3>{t('eye.title', { eye: eyeName(eye) })}</h3>
        <p id="vt-amsler-instructions">{t('mark.instructions')}</p>
        <ChoiceGroup<AmslerTool>
          legend={t('kind')}
          inline
          choices={tools.map((value) => ({ value, label: t(`kind.${value}`) }))}
          value={tool}
          onChange={setTool}
        />
        <p className="vt-measure" aria-live="polite">
          {t('marked', { count: marks.length })}
          {marks.length > 0 && (
            <>
              {' '}
              <Button variant="ghost" onClick={() => setMarks([])}>
                {t('clear')}
              </Button>
            </>
          )}
        </p>
        <div className="vt-actions">
          <Button variant="primary" size="lg" disabled={marks.length > 0} onClick={() => finishEye(eye, [])}>
            {t('nothing')}
          </Button>
          <Button variant="primary" size="lg" disabled={marks.length === 0} onClick={() => finishEye(eye, marks)}>
            {t('saveMarks')}
          </Button>
        </div>
        {marks.length > 0 && <p className="vt-note">{t('nothing.disabled')}</p>}
      </section>
    );
  } else if (phase.kind === 'summary' && results.OD && results.OS) {
    const { OD, OS } = results;
    body = (
      <section className="vt-panel">
        <FocusHeading>{t('result.title')}</FocusHeading>
        <div className="vt-columns">
          {EYES.map((eye) => (
            <Card key={eye} as="article" title={tc(`eye.${eye}`)}>
              <AmslerResultView result={results[eye]!} />
            </Card>
          ))}
        </div>
        <FixedTexts />
        <div className="vt-actions">
          <Button variant="primary" size="lg" onClick={() => onComplete({ OD, OS })}>
            {tv('saveAndContinue')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="vt-root">
      <header className="vt-header">
        <h1 className="vt-title">{t('title')}</h1>
        <p className="vt-note">{tv('realTest')}</p>
      </header>
      {body}
      <div className="vt-skip">
        <Button variant="ghost" onClick={onSkip}>
          {tc('action.skip')}
        </Button>
      </div>
    </div>
  );
}

function FixedTexts() {
  const t = useMessages(amslerMessages);
  return (
    <div className="vt-reference">
      <p>{t('positive')}</p>
      <p>{t('limits')}</p>
    </div>
  );
}

function AmslerResultView({ result }: { result: AmslerResult }) {
  const t = useMessages(amslerMessages);
  const { formatNumber } = useI18n();
  const count = (kind: AmslerMarkKind) => result.marks.filter((mark) => mark.kind === kind).length;
  const kinds = AMSLER_MARK_KINDS.filter((kind) => count(kind) > 0)
    .map((kind) => `${t(`kind.${kind}`)} ${count(kind)}`)
    .join(', ');
  return (
    <>
      {result.marks.length === 0 ? (
        <p>{t('result.clean')}</p>
      ) : (
        <p>
          {t('result.marks', {
            count: result.marks.length,
            pct: formatNumber(result.markedFraction, { style: 'percent', maximumFractionDigits: 1 }),
            kinds,
          })}
        </p>
      )}
      {result.centralMarked && <p className="vt-caution">{t('result.central')}</p>}
      <p className="vt-note">{t(result.cornersSeen ? 'result.corners.yes' : 'result.corners.no')}</p>
      <OriginTag origin="self-reported" />
    </>
  );
}
