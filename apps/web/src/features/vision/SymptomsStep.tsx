import type { Eye, SymptomAnswer, SymptomAnswers, SymptomId, SymptomSeverity } from '@app/core';
import {
  GLASSES_OPTIONS,
  OTHER_SYMPTOMS,
  URGENT_SYMPTOMS,
  VISION_CHANGE_SYMPTOMS,
  hasUrgentSymptom,
  initialSymptomAnswers,
  normalizeSymptomAnswers,
  symptomTakesEye,
  symptomTakesSeverity,
} from '@app/core/vision/index';
import { useState } from 'react';
import { commonMessages } from '../../i18n/common';
import { useMessages } from '../../i18n';
import { Button, OriginTag } from '../../ui';
import { ChoiceGroup } from './ChoiceGroup';
import { FocusHeading } from './FocusHeading';
import { symptomsMessages, visionMessages } from './messages';
import { Warning } from './Warning';
import './vision.css';

interface Props {
  onComplete(answers: SymptomAnswers): void;
  onSkip(): void;
}

const SEVERITIES: readonly SymptomSeverity[] = ['mild', 'moderate', 'severe'];
const EYE_CHOICES: readonly (Eye | 'both')[] = ['OD', 'OS', 'both'];
/** Vision topics per page: a few at a time. */
const TOPICS_PER_PAGE = 3;

type Page =
  | { kind: 'intro' }
  | { kind: 'urgent' }
  | { kind: 'change' }
  | { kind: 'topics'; ids: readonly SymptomId[]; index: number; count: number }
  | { kind: 'other' }
  | { kind: 'glasses' }
  | { kind: 'review' };

function pagesFor(changeNoticed: boolean): Page[] {
  const topicPages: Page[] = [];
  if (changeNoticed) {
    const count = Math.ceil(VISION_CHANGE_SYMPTOMS.length / TOPICS_PER_PAGE);
    for (let index = 0; index < count; index++) {
      const ids = VISION_CHANGE_SYMPTOMS.slice(index * TOPICS_PER_PAGE, (index + 1) * TOPICS_PER_PAGE);
      topicPages.push({ kind: 'topics', ids, index, count });
    }
  }
  return [{ kind: 'intro' }, { kind: 'urgent' }, { kind: 'change' }, ...topicPages, { kind: 'other' }, { kind: 'glasses' }, { kind: 'review' }];
}

type Question = SymptomId | 'changeNoticed' | 'glasses';

function questionsOf(page: Page): Question[] {
  switch (page.kind) {
    case 'urgent':
      return [...URGENT_SYMPTOMS];
    case 'change':
      return ['changeNoticed'];
    case 'topics':
      return [...page.ids];
    case 'other':
      return [...OTHER_SYMPTOMS];
    case 'glasses':
      return ['glasses'];
    default:
      return [];
  }
}

/** Symptom questionnaire (spec 03, section 1): the two urgent questions first, then NASA's topics. */
export function SymptomsStep({ onComplete, onSkip }: Props) {
  const t = useMessages(symptomsMessages);
  const tv = useMessages(visionMessages);
  const tc = useMessages(commonMessages);
  const [answers, setAnswers] = useState<SymptomAnswers>(initialSymptomAnswers);
  const [asked, setAsked] = useState<ReadonlySet<Question>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const pages = pagesFor(answers.changeNoticed);
  const page = pages[Math.min(pageIndex, pages.length - 1)]!;
  const urgent = hasUrgentSymptom(answers);

  const mark = (question: Question) => setAsked((previous) => new Set(previous).add(question));
  const setAnswer = (id: SymptomId, update: Partial<SymptomAnswer>) => {
    mark(id);
    setAnswers((previous) => ({
      ...previous,
      answers: { ...previous.answers, [id]: { ...previous.answers[id], ...update } },
    }));
  };

  const complete = questionsOf(page).every((question) => {
    if (!asked.has(question)) return false;
    if (question === 'changeNoticed' || question === 'glasses') return true;
    const answer = answers.answers[question];
    if (!answer.present) return true;
    return (!symptomTakesSeverity(question) || answer.severity) && (!symptomTakesEye(question) || answer.eye);
  });

  const eyeLabel = (eye: Eye | 'both') => (eye === 'both' ? tv('eye.both') : tc(`eye.${eye}`));
  const yesNo = [
    { value: 'yes' as const, label: tv('yes') },
    { value: 'no' as const, label: tv('no') },
  ];

  const symptomQuestion = (id: SymptomId) => {
    const answer = answers.answers[id];
    const answered = asked.has(id);
    return (
      <div key={id} className="vt-question">
        <ChoiceGroup
          legend={t(`q.${id}`)}
          inline
          choices={yesNo}
          value={answered ? (answer.present ? 'yes' : 'no') : null}
          onChange={(value) => setAnswer(id, { present: value === 'yes' })}
        />
        {answered && answer.present && symptomTakesSeverity(id) && (
          <ChoiceGroup
            legend={t('severity')}
            choices={SEVERITIES.map((value) => ({ value, label: t(`severity.${value}`) }))}
            value={answer.severity ?? null}
            onChange={(severity) => setAnswer(id, { severity })}
          />
        )}
        {answered && answer.present && symptomTakesEye(id) && (
          <ChoiceGroup
            legend={tv('eye.question')}
            inline
            choices={EYE_CHOICES.map((value) => ({ value, label: eyeLabel(value) }))}
            value={answer.eye ?? null}
            onChange={(eye) => setAnswer(id, { eye })}
          />
        )}
      </div>
    );
  };

  let content;
  switch (page.kind) {
    case 'intro':
      content = (
        <>
          <FocusHeading>{t('title')}</FocusHeading>
          <p className="vt-lead">{t('intro')}</p>
        </>
      );
      break;
    case 'urgent':
      content = (
        <>
          <FocusHeading>{t('urgent.title')}</FocusHeading>
          {URGENT_SYMPTOMS.map(symptomQuestion)}
        </>
      );
      break;
    case 'change':
      content = (
        <>
          <FocusHeading>{t('change.title')}</FocusHeading>
          <ChoiceGroup
            legend={t('q.changeNoticed')}
            inline
            choices={yesNo}
            value={asked.has('changeNoticed') ? (answers.changeNoticed ? 'yes' : 'no') : null}
            onChange={(value) => {
              mark('changeNoticed');
              setAnswers((previous) => ({ ...previous, changeNoticed: value === 'yes' }));
            }}
          />
        </>
      );
      break;
    case 'topics':
      content = (
        <>
          <FocusHeading key={page.index}>{t('topics.title', { page: page.index + 1, pages: page.count })}</FocusHeading>
          {page.ids.map(symptomQuestion)}
        </>
      );
      break;
    case 'other':
      content = (
        <>
          <FocusHeading>{t('other.title')}</FocusHeading>
          {OTHER_SYMPTOMS.map(symptomQuestion)}
          <p className="vt-reference">{t('other.note')}</p>
        </>
      );
      break;
    case 'glasses':
      content = (
        <>
          <FocusHeading>{t('glasses.title')}</FocusHeading>
          <ChoiceGroup
            legend={t('q.glasses')}
            choices={GLASSES_OPTIONS.map((value) => ({ value, label: t(`glasses.${value}`) }))}
            value={asked.has('glasses') ? answers.glasses : null}
            onChange={(glasses) => {
              mark('glasses');
              setAnswers((previous) => ({ ...previous, glasses }));
            }}
          />
        </>
      );
      break;
    case 'review': {
      const final = normalizeSymptomAnswers(answers);
      const present = Object.entries(final.answers).filter(([, answer]) => answer.present) as [SymptomId, SymptomAnswer][];
      content = (
        <>
          <FocusHeading>{t('review.title')}</FocusHeading>
          {!final.changeNoticed && <p>{t('review.noChange')}</p>}
          {present.length === 0 ? (
            <p>{t('review.none')}</p>
          ) : (
            <ul className="vt-review">
              {present.map(([id, answer]) => (
                <li key={id}>
                  <strong>{t(`q.${id}`)}</strong>
                  {answer.severity && <> · {t(`severity.${answer.severity}`)}</>}
                  {answer.eye && <> · {eyeLabel(answer.eye)}</>}
                </li>
              ))}
            </ul>
          )}
          <p>{t('review.glasses', { value: t(`glasses.${final.glasses}`) })}</p>
          <p>
            <OriginTag origin="self-reported" />
          </p>
          <p className="vt-reference">{t('other.note')}</p>
        </>
      );
      break;
    }
  }

  const isLast = page.kind === 'review';
  return (
    <div className="vt-root">
      <header className="vt-header">
        <h1 className="vt-title">{t('title')}</h1>
        <p className="vt-note">{tv('step', { current: pageIndex + 1, total: pages.length })}</p>
      </header>
      {urgent && page.kind !== 'intro' && <Warning title={t('urgent.warning.title')}>{t('urgent.warning.body')}</Warning>}
      <section className="vt-panel" key={pageIndex}>
        {content}
      </section>
      {!complete && page.kind !== 'intro' && !isLast && <p className="vt-note">{t('complete')}</p>}
      <div className="vt-actions vt-actions--nav">
        {pageIndex > 0 && (
          <Button size="lg" onClick={() => setPageIndex(isLast ? 1 : pageIndex - 1)}>
            {isLast ? t('review.edit') : tc('action.back')}
          </Button>
        )}
        {isLast ? (
          <Button variant="primary" size="lg" onClick={() => onComplete(normalizeSymptomAnswers(answers))}>
            {tv('saveAndContinue')}
          </Button>
        ) : (
          <Button variant="primary" size="lg" disabled={!complete} onClick={() => setPageIndex(pageIndex + 1)}>
            {page.kind === 'intro' ? t('start') : tc('action.continue')}
          </Button>
        )}
      </div>
      <div className="vt-skip">
        <Button variant="ghost" onClick={onSkip}>
          {tc('action.skip')}
        </Button>
      </div>
    </div>
  );
}
