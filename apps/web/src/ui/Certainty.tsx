import type { LikelihoodWord } from '@app/core';
import type { ReactNode } from 'react';
import { OriginTag } from './OriginTag';

const WORDS: readonly LikelihoodWord[] = ['unlikely', 'possible', 'likely', 'very-likely'];

interface Props {
  word: LikelihoodWord;
  /** The word, written for the language. */
  wordText: string;
  /** The probability as it is written: "69 %", "less than 1 %". */
  percent: string;
  /** What the probability is about: the threshold. */
  label: ReactNode;
}

/**
 * How sure a result is: the probability of having passed a threshold, with its word glued
 * to its number. Four stretches as wide as their interval (under 10 %, 10 to 50, 50 to 90,
 * over 90); only the one the probability falls in is filled. It is an estimate, and says so.
 */
export function Certainty({ word, wordText, percent, label }: Props) {
  return (
    <div className="co-certeza">
      <p className="co-certeza__palabra">
        <span className="co-certeza__voz">{wordText}</span> <small>{percent}</small>
      </p>
      <ul className="co-certeza__tramos" aria-hidden="true">
        {WORDS.map((candidate) => (
          <li key={candidate} className={candidate === word ? 'is-activo' : undefined} />
        ))}
      </ul>
      <p className="co-rotulo">
        <OriginTag origin="estimated" />
        <span>{label}</span>
      </p>
    </div>
  );
}
