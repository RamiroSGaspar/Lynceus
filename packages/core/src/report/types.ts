/**
 * The report for the medical conference as data: sections with a title,
 * paragraphs and tables, so the interface can draw it and it can also be
 * downloaded as text.
 */
import type { Quantity } from '../contract';
import type { Locale } from '../product';

export type ReportSectionId =
  | 'identification'
  | 'summary'
  | 'eye-OD'
  | 'eye-OS'
  | 'vision'
  | 'next-steps'
  | 'limitations'
  | 'versions'
  | 'questions';

/** A value with its unit, its range and how it was obtained, plus how to write it. */
export interface ReportQuantity {
  quantity: Quantity;
  /** Decimal places. */
  digits: number;
  /** A change: write a plus sign when it is positive. */
  signed: boolean;
}

/** A cell is a text or a quantity. */
export type ReportCell = string | ReportQuantity;

export interface ReportTable {
  /** Empty when the section title says enough. */
  caption: string;
  columns: string[];
  rows: ReportCell[][];
}

export interface ReportSection {
  id: ReportSectionId;
  title: string;
  /** Shown before the tables. */
  paragraphs: string[];
  tables: ReportTable[];
}

export interface Report {
  locale: Locale;
  title: string;
  /** The simulated-data mark: every report carries it. */
  simulatedDataNotice: string;
  /** What the report is for, in one sentence. */
  purpose: string;
  sections: ReportSection[];
}
