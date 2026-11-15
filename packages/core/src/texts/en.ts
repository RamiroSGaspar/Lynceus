/** English sentences. Structure and writing rules: `phrases.ts`. */
import type { Eye, LikelihoodWord, NotMeasuredReason, SymptomId } from '../contract';
import { capitalize, NBSP, type PercentText, type SignedText } from './format';
import type {
  AcuityWorse,
  AcuteCause,
  AmslerMarks,
  ChangeText,
  EyeSet,
  FunctionalTest,
  Phrases,
  PromptCause,
  ReportedSymptom,
  StepValues,
  ThicknessReference,
} from './phrases';

const UM = `${NBSP}µm`;
const LOGMAR = `${NBSP}logMAR`;

const EYE: Readonly<Record<Eye, string>> = { OD: 'right eye', OS: 'left eye' };

const WORD: Readonly<Record<LikelihoodWord, string>> = {
  unlikely: 'unlikely',
  possible: 'possible',
  likely: 'likely',
  'very-likely': 'very likely',
};

const SYMPTOM: Readonly<Record<SymptomId, string>> = {
  'near-vision': 'worse near vision',
  'intermediate-vision': 'worse vision at arm’s length',
  'distance-vision': 'worse distance vision',
  distortion: 'distorted vision',
  'low-light-vision': 'worse vision in dim light',
  'fluctuating-vision': 'vision that fluctuates',
  'depth-perception': 'trouble judging depth',
  'double-vision': 'double vision',
  'transient-vision-loss': 'a passing loss of vision',
  'sudden-vision-loss': 'a sudden loss of vision',
  'new-dark-spot': 'a new dark spot in your vision',
  headache: 'a headache',
  tinnitus: 'ringing in the ears',
  nausea: 'nausea',
  'difficulty-thinking': 'difficulty thinking',
};

const TEST: Readonly<Record<FunctionalTest, string>> = {
  symptoms: 'the questionnaire',
  acuity: 'the near vision test',
  amsler: 'the Amsler grid',
};

const NOT_MEASURED: Readonly<Record<NotMeasuredReason, string>> = {
  'low-signal': 'The signal of the scan was too weak.',
  'signal-dropout': 'Part of the image was missing, as happens with a blink.',
  truncated: 'The retina was cut off at the top of the image.',
  'surface-not-found': 'The surface of the retina could not be found in the image.',
  'bmo-not-found': 'The edge of the optic nerve opening could not be found in the image.',
  motion: 'The eye moved during the scan.',
  'too-few-usable-scans': 'Too few of the scan lines were good enough to measure.',
  'bmo-fit-failed': 'The outline of the optic nerve opening could not be traced reliably.',
  'bmo-mismatch-with-baseline': 'The optic nerve opening found today does not match the one in your pre-flight exam.',
  'insufficient-ring-coverage': 'Too little of the ring around the optic nerve could be measured.',
  decentered: 'The scan was not centred on the optic nerve.',
  'not-captured': 'No scan of this eye was taken.',
  'no-baseline': 'There is no pre-flight exam of this eye to compare with.',
};

function yourEyes(eyes: EyeSet): string {
  return eyes === 'both' ? 'both eyes' : `your ${EYE[eyes]}`;
}

function eyesNote(eyes: EyeSet | null): string {
  return eyes === null ? '' : ` (${eyes === 'both' ? 'both eyes' : EYE[eyes]})`;
}

function list(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function days(count: number): string {
  return count === 1 ? '1 day' : `${count} days`;
}

function likelihood(word: LikelihoodWord, percent: PercentText): string {
  const number =
    percent.kind === 'below' ? `less than ${percent.text}` : percent.kind === 'above' ? `more than ${percent.text}` : percent.text;
  return `${WORD[word]} (${number})`;
}

function thickness(change: ChangeText, reference: ThicknessReference): string {
  const than = { 'before-flight': ' than before the flight', 'own-preflight-exam': ' than in your own pre-flight exam', none: '' }[reference];
  const same = {
    'before-flight': 'unchanged from before the flight',
    'own-preflight-exam': 'unchanged from your own pre-flight exam',
    none: 'unchanged',
  }[reference];
  const { value, range } = change;
  const main = value.sign === 0 ? same : `${value.abs}${UM} ${value.sign > 0 ? 'thicker' : 'thinner'}${than}`;
  if (!range) return main;
  const [low, high] = range;
  const side = (bound: SignedText) => (bound.sign === 0 ? `0${UM}` : `${bound.abs}${UM} ${bound.sign > 0 ? 'thicker' : 'thinner'}`);
  let rangeText: string;
  if (value.sign > 0 && low.sign >= 0) rangeText = `range ${low.abs} to ${high.abs}`;
  else if (value.sign < 0 && high.sign <= 0) rangeText = `range ${high.abs} to ${low.abs}`;
  else rangeText = `range: from ${side(low)} to ${side(high)}`;
  return value.sign === 0 ? `${same} (0${UM}; ${rangeText})` : `${main} (${rangeText})`;
}

function signedRange(change: ChangeText): string {
  return change.range ? ` (range ${change.range[0].signed} to ${change.range[1].signed})` : '';
}

function reported(symptoms: readonly ReportedSymptom[]): string {
  return list(symptoms.map((symptom) => `${SYMPTOM[symptom.id]}${eyesNote(symptom.eye)}`));
}

function amslerMarks(marks: readonly AmslerMarks[], brief = false): string {
  return list(
    marks.map((mark) => {
      const share = brief ? '' : `, ${mark.fraction} of the grid`;
      return mark.where === 'centre'
        ? `marks at the centre of your vision (${EYE[mark.eye]}${share})`
        : mark.where === 'extensive'
          ? `marks over ${mark.fraction} of its area (${EYE[mark.eye]})`
          : `marks away from its centre (${EYE[mark.eye]}${share})`;
    }),
  );
}

function acuityWorse(eyes: readonly AcuityWorse[], brief = false): string {
  return list(
    eyes.map((item) => `${EYE[item.eye]} by ${item.change.value.abs}${LOGMAR}${brief ? '' : signedRange(item.change)}`),
  );
}

function acuteCause(cause: AcuteCause): string {
  switch (cause.kind) {
    case 'symptom':
      return `you reported ${SYMPTOM[cause.id]}${eyesNote(cause.eye)}`;
    case 'amsler-central':
      return `the Amsler grid shows marks at the centre of your vision (${EYE[cause.eye]})`;
    case 'amsler-extensive':
      return `the Amsler grid shows marks over ${cause.fraction} of its area (${EYE[cause.eye]})`;
    case 'unspecified':
      return 'today’s answers or vision tests show an acute visual symptom';
  }
}

function promptCause(cause: PromptCause): string {
  switch (cause.kind) {
    case 'concerning':
      return `The change in ${yourEyes(cause.eyes)} is at NASA’s clinically concerning level, where NASA decides case by case what to do.`;
    case 'amsler':
      return `The Amsler grid shows ${amslerMarks(cause.marks)}: for NASA, any wavy, blurred or missing line is a positive result.`;
    case 'symptoms':
      return `You reported ${reported(cause.symptoms)}.`;
    case 'activities-affected':
      return `You reported ${reported(cause.symptoms)}, at a grade that affected or prevented your activities.`;
    case 'headache-activities-affected':
      return 'You reported a headache that affected or prevented your activities.';
  }
}

const OWN_RULE_INTERVAL =
  'This interval is this tool’s own rule, based on the one published case';

function step(id: Parameters<Phrases['step']>[0], v: StepValues): { text: string; why: string } {
  const when = `flight day ${v.flightDay}`;
  const inDays = v.inDays === null ? '' : days(v.inDays);
  switch (id) {
    case 'contact-surgeon-now': {
      const causes = v.acuteCauses.map((cause) => `${capitalize(acuteCause(cause))}.`).join(' ');
      return {
        text: 'Contact your flight surgeon now.',
        why: `${causes} A sudden change in vision cannot wait for the routine report, whatever the scan shows. NASA’s rule for this case is not public: treating it this way is this tool’s own rule.`,
      };
    }
    case 'notify-surgeon-without-delay': {
      const causes =
        v.promptCauses.length > 0
          ? v.promptCauses.map(promptCause).join(' ')
          : 'Today’s result includes a finding that should not wait for the routine report.';
      return {
        text: 'Tell your flight surgeon about this result without waiting for the routine report.',
        why: `${causes} Telling the flight surgeon early in these cases is this tool’s own rule: NASA’s is not public.`,
      };
    }
    case 'report-routine':
      return {
        text: 'This result goes into the routine report for your flight surgeon.',
        why: 'After each exam, NASA sends a summary report to the crew’s flight surgeon, who reviews every result.',
      };
    case 'oct-routine':
      return {
        text: `Next scan of both eyes: ${when}, your next routine exam${inDays ? ` (in ${inDays})` : ''}.`,
        why: `NASA’s routine calendar for a mission of this length has eye exams on flight days ${list(v.routineDays.map(String))}.`,
      };
    case 'oct-in-4-weeks':
    case 'oct-in-3-weeks': {
      const firstSign = id === 'oct-in-4-weeks';
      const lead =
        v.sustainedFromFlightDay !== null
          ? firstSign
            ? `Your previous exam (flight day ${v.sustainedFromFlightDay}) showed a first sign, so this tool keeps the 4-week follow-up for one more exam.`
            : `Your previous exam (flight day ${v.sustainedFromFlightDay}) was at the clinically concerning level, so this tool keeps the 3-week follow-up for one more exam.`
          : firstSign
            ? 'After a first sign, this tool asks for the next scan 4 weeks later.'
            : 'At the clinically concerning level, this tool asks for the next scan 3 weeks later.';
      const joined =
        v.targetFlightDay !== null && v.targetFlightDay !== v.flightDay
          ? ` That would be flight day ${v.targetFlightDay}; ${when} is a routine exam of NASA’s calendar and falls close to it, so one scan covers both.`
          : '';
      const closing = firstSign
        ? `NASA does not publish how often to repeat the scan after a first sign. ${OWN_RULE_INTERVAL}.`
        : `NASA does not publish how often to repeat the scan at this level. ${OWN_RULE_INTERVAL}, where the scan was repeated every 3 to 6 weeks.`;
      return {
        text: `Repeat the scan of both eyes on ${when} (in ${inDays}).`,
        why: `${lead}${joined} ${closing}`,
      };
    }
    case 'oct-repeat-soon': {
      const subject =
        v.eyes === 'both' || v.eyes === null
          ? 'Neither eye could be measured today, so they have no result.'
          : `${capitalize(yourEyes(v.eyes))} could not be measured today, so it has no result.`;
      const routine =
        v.inDays !== null && v.maxDays !== null && v.inDays < v.maxDays
          ? ` ${capitalize(when)} is your next routine exam, which comes first.`
          : '';
      return {
        text: `Repeat the scan of both eyes by ${when} (within ${inDays}).`,
        why: `${subject} Waiting at most ${days(v.maxDays ?? 0)} is this tool’s own rule.${routine}`,
      };
    }
    case 'amsler-at-controls':
      return {
        text: 'Do the Amsler grid at each exam, as today.',
        why: 'NASA’s eye exams include the Amsler grid in every session.',
      };
    case 'amsler-twice-a-week':
    case 'amsler-three-times-a-week': {
      const kept =
        v.sustainedFromFlightDay !== null
          ? ` It is kept for one more exam because of the result of your previous exam (flight day ${v.sustainedFromFlightDay}).`
          : '';
      return {
        text: `Do the Amsler grid ${id === 'amsler-twice-a-week' ? 'twice' : 'three times'} a week, one eye at a time.`,
        why: `Between scans, the grid can show a distortion at the centre of your vision. In the one published case it was used several times a week; this frequency is this tool’s own rule.${kept}`,
      };
    }
    case 'try-stronger-glasses': {
      const causes: string[] = [];
      if (v.acuityWorse.length > 0) {
        causes.push(
          `Your near vision test is worse than before the flight: ${acuityWorse(v.acuityWorse)}. This tool takes ${v.acuityLimit} or more, about two lines of a chart, as a real change.`,
        );
        if (v.acuityWorse.some((item) => !item.sameCorrection)) {
          causes.push('Part of the difference may come from the glasses: the two tests were not both done with, or both without, your near correction.');
        }
      }
      if (v.nearBlurReported) causes.push('You reported worse near vision.');
      causes.push(
        'Worse near vision is the most common change on long flights, and NASA flies at least three pairs of glasses of increasing strength per crew member for it. Glasses correct the blur, not its cause, and a change of prescription cannot be measured on board: this is something to try, not a measurement.',
      );
      return { text: 'For near work, try the stronger pair of your on-board glasses.', why: causes.join(' ') };
    }
    case 'post-flight-exams': {
      const reason =
        v.targetFlightDay !== null
          ? `The next scan would fall on flight day ${v.targetFlightDay}, after the end of the mission (flight day ${v.missionDays}).`
          : 'No routine exam is left in NASA’s calendar for this mission.';
      return {
        text: 'No further scan is planned in flight: your next eye exams are after landing.',
        why: `${reason} NASA examines the eyes between 1 and 3 days after return.`,
      };
    }
  }
}

export const EN: Phrases = {
  yourEyes,
  list,
  likelihood,
  thickness,
  symptom: (id) => SYMPTOM[id],

  headlineReference: (notMeasured) =>
    notMeasured.length === 0
      ? 'This is your pre-flight reference exam: later exams are compared with it.'
      : notMeasured.length === 2
        ? 'This is your pre-flight exam, but neither eye could be measured: there is no reference yet.'
        : `This is your pre-flight reference exam: later exams are compared with it; ${yourEyes(notMeasured[0]!)} could not be measured and has no reference.`,
  headlineAcute: () => 'Today’s answers or vision tests show an acute visual symptom: contact your flight surgeon now.',
  headlineLevel: (level, eyes, notMeasured) => {
    const main =
      level === 'clinically-concerning'
        ? `The change in ${yourEyes(eyes)} is at NASA’s clinically concerning level`
        : `The change in ${yourEyes(eyes)} is at NASA’s first-sign level`;
    return notMeasured.length > 0 ? `${main}; ${yourEyes(notMeasured[0]!)} could not be measured today.` : `${main}.`;
  },
  headlineNoChange: (measured, notMeasured) =>
    notMeasured.length === 0
      ? 'No detectable change in either eye since before the flight.'
      : `No detectable change in ${yourEyes(measured[0]!)} since before the flight; ${yourEyes(notMeasured[0]!)} could not be measured today.`,
  headlineNothingMeasured: () => 'Neither eye could be measured today: this exam has no scan result.',

  summaryAcute: (causes) =>
    `${capitalize(list(causes.map(acuteCause)))}: contact your flight surgeon now, whatever the scan shows.`,
  summaryThickness: ({ eye, lead, change, relation, close, firstSign, concerning }) => {
    const opening = {
      'only-eye': `In your ${EYE[eye]}, the`,
      'larger-increase': `The larger increase is in your ${EYE[eye]}: the`,
      'no-increase': `Neither eye shows an increase: in your ${EYE[eye]}, the`,
    }[lead];
    const where =
      relation === 'at-or-above-concerning'
        ? `at or above NASA’s clinically concerning threshold of ${concerning}`
        : relation === 'above-first-sign'
          ? `above NASA’s first-sign threshold of ${firstSign}`
          : relation === 'at-first-sign'
            ? `exactly at NASA’s first-sign threshold of ${firstSign}, which only a larger change passes`
            : `below NASA’s first-sign threshold of ${firstSign}${close ? ', but close to it' : ''}`;
    return `${opening} retina next to the optic nerve is ${thickness(change, 'own-preflight-exam')}, ${where}.`;
  },
  summaryNothingMeasured: () => 'No scan could be measured today, so this exam has no result for the back of your eyes.',
  summaryFolds: (eyes) => `The scan also indicates new folds in ${yourEyes(eyes)}; NASA counts any fold as a first sign.`,
  summaryFunctional: (findings, notDone) => {
    const skipped = notDone.length > 0 ? `; not done today: ${list(notDone.map((test) => TEST[test]))}` : '';
    return findings.length > 0
      ? `In today’s vision tests and answers: ${findings.join('; ')}${skipped}.`
      : `Today’s vision tests and answers add no finding${skipped}.`;
  },
  summaryFunctionalNotDone: (scanMeasured) =>
    scanMeasured
      ? 'The vision tests and the questionnaire were not done today, so this result rests on the scan alone.'
      : 'The vision tests and the questionnaire were not done today either.',
  summaryMeaning: (kind) =>
    kind === 'threshold'
      ? 'Passing a threshold is not a diagnosis: most cases cause no symptoms, and your flight surgeon on the ground confirms the result and decides what to do.'
      : kind === 'first-reading'
        ? 'This is a first reading and not a diagnosis: your flight surgeon on the ground confirms it and decides what to do.'
        : 'No number is shown for a scan that could not be measured, and your flight surgeon on the ground is told that it has to be repeated.',
  summaryReference: () => [
    'This exam records how the back of each eye measures before the flight.',
    'Every in-flight exam is compared with these values of your own, not with an average of other people.',
  ],

  eyeHeadline: (eye, state) => {
    const name = capitalize(EYE[eye]);
    switch (state) {
      case 'reference':
        return `${name}: pre-flight reference.`;
      case 'not-measured':
        return `I could not measure your ${EYE[eye]} today.`;
      case 'no-detectable-change':
        return `${name}: no detectable change since before the flight.`;
      case 'first-sign':
        return `${name}: first sign of optic nerve swelling, by NASA’s threshold.`;
      case 'first-sign-folds':
        return `${name}: first sign, from new folds.`;
      case 'clinically-concerning':
        return `${name}: clinically concerning change, by NASA’s threshold.`;
    }
  },
  eyeReference: () => 'This is the reference for this eye: every in-flight exam is compared with it.',
  eyeNotMeasuredReason: (reason) => NOT_MEASURED[reason],
  eyeNoResult: () => 'There is no result for this eye today: a number that cannot be supported is not shown.',
  eyeThickness: (eye, change) =>
    `The retina next to your ${eye === 'OD' ? 'right' : 'left'} optic nerve is ${thickness(change, 'before-flight')}.`,
  eyeRelation: (relation, firstSign, concerning) =>
    relation === 'at-or-above-concerning'
      ? `That is at or above NASA’s clinically concerning threshold of ${concerning}.`
      : relation === 'above-first-sign'
        ? `That is above NASA’s first-sign threshold of ${firstSign} and below its clinically concerning threshold of ${concerning}.`
        : relation === 'at-first-sign'
          ? `That is exactly NASA’s first-sign threshold of ${firstSign}, which only a larger change passes.`
          : `That is below NASA’s first-sign threshold of ${firstSign}, within the normal variation between two exams.`,
  eyeProbability: (threshold, chance, close) => {
    const claim =
      threshold === 'first-sign'
        ? `It is ${chance} that the real change is above the first-sign threshold`
        : `It is ${chance} that the real change is at or above the clinically concerning threshold`;
    return close ? `${claim}: this result is close to it, and your next exam will show whether it holds.` : `${claim}.`;
  },
  eyeFolds: (isNew, change, limit) =>
    isNew
      ? `The scan indicates new folds: the waviness of the membrane under the retina rose by ${change.value.abs}${UM} since before the flight${signedRange(change)}, above the limit of ${limit}.`
      : `No new folds: the waviness of the membrane under the retina changed by ${change.value.signed}${UM} since before the flight${signedRange(change)}; the limit is ${limit}.`,
  eyeFoldsProbability: (chance, isNew) =>
    isNew
      ? `It is ${chance} that the real change is above that limit; NASA counts any fold as a first sign.`
      : `It is ${chance} that the real change is above that limit.`,
  eyeSincePrevious: (flightDay, change) =>
    `Since your previous exam (flight day ${flightDay}), it is ${thickness(change, 'none')}.`,

  step,

  limitation: (id, provisionalErrorModel) => {
    switch (id) {
      case 'not-a-diagnosis':
        return 'This is not a diagnosis: it is a first reading of a measurement against NASA’s published thresholds.';
      case 'simulated-data':
        return 'The exams in this demonstration are simulated; the analysis that measures them is real.';
      case 'not-validated-on-people':
        return provisionalErrorModel
          ? 'This tool has not been validated on people. Its ranges and probabilities come from a provisional error model that has not been measured yet.'
          : 'This tool has not been validated on people. Its ranges and probabilities come from its error on simulated eyes.';
      case 'ground-confirms':
        return 'Your flight surgeon on the ground confirms every result and has the final word.';
      case 'no-intracranial-pressure':
        return 'The pressure inside the skull cannot be measured on board.';
      case 'no-choroid':
        return 'It does not measure the choroid, the layer of blood vessels under the retina.';
      case 'no-macula':
        return 'It does not look at the macula, the centre of the retina: the scan covers only the area around the optic nerve.';
      case 'no-globe-flattening':
        return 'It does not measure flattening of the back of the eye.';
      case 'no-refraction':
        return 'It does not measure a change in your glasses prescription: there is no reliable way to do that on board.';
    }
  },

  finding: (finding, brief) => {
    switch (finding.id) {
      case 'swelling-clinically-concerning':
        return `the change in ${yourEyes(finding.eyes)} is at NASA’s clinically concerning level`;
      case 'swelling-first-sign':
        return `the change in ${yourEyes(finding.eyes)} is at NASA’s first-sign level`;
      case 'folds-new':
        return `the scan indicates new folds in ${yourEyes(finding.eyes)}`;
      case 'eye-not-measured':
        return finding.eyes === 'both' ? 'neither eye could be measured' : `${yourEyes(finding.eyes)} could not be measured`;
      case 'symptom-acute':
        return finding.symptoms.length > 0 ? `you reported ${reported(finding.symptoms)}` : 'you reported an acute visual symptom';
      case 'amsler-marked-central':
      case 'amsler-marked':
        return finding.marks.length > 0 ? `the Amsler grid shows ${amslerMarks(finding.marks, brief)}` : 'the Amsler grid shows marks';
      case 'symptom-other':
        return finding.symptoms.length > 0 ? `you reported ${reported(finding.symptoms)}` : 'you reported a change in vision';
      case 'near-vision-worse':
        return finding.eyes.length === 0
          ? 'your near vision test is worse than before the flight'
          : brief
            ? `your near vision test is worse than before the flight (${acuityWorse(finding.eyes, true)})`
            : `your near vision test is worse than before the flight: ${acuityWorse(finding.eyes)}`;
      case 'symptom-near-blur':
        return 'you reported worse near vision';
      case 'symptom-headache':
        return brief ? 'you reported a headache' : 'you reported a headache, which is recorded without linking it to the eye findings';
    }
  },
};
