import { useId } from 'react';

export interface Choice<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  legend: string;
  choices: readonly Choice<V>[];
  value: V | null;
  onChange(value: V): void;
  /** Lay the choices side by side when they are short. */
  inline?: boolean;
}

/** Big radio buttons: arrow keys move inside the group, Tab moves between groups, any choice is a 44 px target. */
export function ChoiceGroup<V extends string>({ legend, choices, value, onChange, inline = false }: Props<V>) {
  const name = useId();
  return (
    <fieldset className={`vt-choice${inline ? ' vt-choice--inline' : ''}`}>
      <legend className="vt-choice__legend">{legend}</legend>
      <div className="vt-choice__options">
        {choices.map((choice) => (
          <label key={choice.value} className="vt-choice__option">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
