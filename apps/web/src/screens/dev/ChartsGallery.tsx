import type { CrewId, Quantity } from '@app/core';
import { CREW, MISSION, TRT_CLINICALLY_CONCERNING_UM, TRT_FIRST_SIGN_UM, getHistory } from '../../app/core';
import { changePoints, type ChangePoint } from '../../app/history';
import { useDocumentTitle } from '../../app/hooks';
import { ChangeScale, type ScaleMark } from '../../charts/ChangeScale';
import { HistoryChart } from '../../charts/HistoryChart';
import { ScreenTitle } from '../../shell/ScreenTitle';

/**
 * Development page (`#/dev/charts`): the two charts with sample values of the
 * contract types, at laptop and phone width. Not linked from the application.
 * SIMULATED DATA.
 */
const THRESHOLDS = { firstSignUm: TRT_FIRST_SIGN_UM, clinicallyConcerningUm: TRT_CLINICALLY_CONCERNING_UM };

function change(value: number, halfRange = 8.3): Quantity {
  return {
    value,
    unit: 'µm',
    origin: 'derived',
    standardError: halfRange / 1.96,
    interval95: [value - halfRange, value + halfRange],
  };
}

const mark = (flightDay: number, value: number): ScaleMark => ({ flightDay, change: change(value) });

const SCALE_CASES: { name: string; today: ScaleMark | null; previous: ScaleMark[] }[] = [
  { name: 'No change', today: mark(150, 9), previous: [mark(30, 6), mark(90, 8)] },
  { name: 'First sign', today: mark(150, 31), previous: [mark(30, 15), mark(90, 24), mark(118, 27)] },
  { name: 'Just under the first threshold', today: mark(90, 19), previous: [mark(30, 12)] },
  {
    name: 'Clinically concerning',
    today: mark(150, 66),
    previous: [mark(30, 27), mark(58, 37), mark(90, 48), mark(118, 57), mark(139, 63)],
  },
  {
    name: 'Extreme case',
    today: mark(150, 168),
    previous: [mark(30, 118), mark(51, 160), mark(72, 190), mark(90, 203), mark(111, 195), mark(132, 182)],
  },
  { name: 'First control', today: mark(30, 15), previous: [] },
  { name: 'Not measured today', today: null, previous: [mark(30, 15), mark(90, 24)] },
];

function crewPoints(crewId: CrewId): Record<'OD' | 'OS', ChangePoint[]> {
  const history = getHistory(crewId, MISSION.durationDays + 1);
  return { OD: changePoints(history, 'OD'), OS: changePoints(history, 'OS') };
}

/** Crew member B with the left eye not measured on day 90 and the last control done in this browser. */
function mixedPoints(): Record<'OD' | 'OS', ChangePoint[]> {
  const { OD, OS } = crewPoints('B');
  const last = (points: ChangePoint[]): ChangePoint[] =>
    points.map((point, index) => (index === points.length - 1 ? { ...point, origin: 'live' } : point));
  return {
    OD: last(OD),
    OS: last(OS).map((point) =>
      point.flightDay === 90 ? { ...point, measured: false, level: null, change: null } : point,
    ),
  };
}

export function ChartsGallery() {
  useDocumentTitle('Charts');
  return (
    <div className="co-detalle co-velo co-detalle--primera">
      <section className="co-seccion co-seccion--apilada">
        <ScreenTitle>Charts (development page, sample values)</ScreenTitle>
      </section>
      {CREW.map((member) => (
        <section key={member.id} className="co-seccion co-seccion--apilada">
          <h2 className="co-subtitulo">Evolution: {member.name}</h2>
          <HistoryChart points={crewPoints(member.id)} mission={MISSION} thresholds={THRESHOLDS} currentDay={150} nextScanDay={171} />
          <div className="co-dev__angosto">
            <HistoryChart points={crewPoints(member.id)} mission={MISSION} thresholds={THRESHOLDS} currentDay={150} />
          </div>
        </section>
      ))}
      <section className="co-seccion co-seccion--apilada">
        <h2 className="co-subtitulo">Evolution: one eye not measured, last control done here</h2>
        <HistoryChart points={mixedPoints()} mission={MISSION} thresholds={THRESHOLDS} currentDay={150} />
      </section>
      {SCALE_CASES.map(({ name, today, previous }) => (
        <section key={name} className="co-seccion co-seccion--apilada">
          <h2 className="co-subtitulo">{name}</h2>
          <ChangeScale eye="OD" today={today} previous={previous} thresholds={THRESHOLDS} />
          <div className="co-dev__angosto">
            <ChangeScale eye="OS" today={today} previous={previous} thresholds={THRESHOLDS} />
          </div>
        </section>
      ))}
    </div>
  );
}
