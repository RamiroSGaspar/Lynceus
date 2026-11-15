/** The report as Markdown text, to download it or print it. */
import type { Locale } from '../product';
import { NBSP, signedText } from '../texts/format';
import { REPORT_LABELS } from './labels';
import type { Report, ReportCell, ReportQuantity, ReportTable } from './types';

function signedNumber(value: number, cell: ReportQuantity, locale: Locale): string {
  const text = signedText(value, cell.digits, locale);
  // A change says its direction: plus when it rose. A value that rounds to zero has no sign.
  return cell.signed && text.sign > 0 ? `+${text.abs}` : text.signed;
}

/** A quantity as text: value, unit, 95 % range when it has one, and how it was obtained. */
export function quantityText(cell: ReportQuantity, locale: Locale): string {
  const L = REPORT_LABELS[locale];
  const { quantity } = cell;
  const unit = quantity.unit ? `${NBSP}${quantity.unit}` : '';
  const range = quantity.interval95
    ? ` (${L.range(signedNumber(quantity.interval95[0], cell, locale), signedNumber(quantity.interval95[1], cell, locale))})`
    : '';
  return `${signedNumber(quantity.value, cell, locale)}${unit}${range} · ${L.origin[quantity.origin]}`;
}

/** One line, with the characters that would break a table cell escaped. */
function cellText(cell: ReportCell, locale: Locale): string {
  const text = typeof cell === 'string' ? cell : quantityText(cell, locale);
  return text.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|');
}

/** A paragraph on one line; a start that Markdown would read as a heading, a quote or a list is escaped. */
function paragraphText(text: string): string {
  return text
    .replace(/\s*\n\s*/g, ' ')
    .trim()
    .replace(/^([#>*+-])/, '\\$1')
    .replace(/^(\d+)([.)])/, '$1\\$2');
}

function tableLines(table: ReportTable, locale: Locale): string[] {
  const row = (cells: readonly ReportCell[]) => `| ${cells.map((cell) => cellText(cell, locale)).join(' | ')} |`;
  return [
    ...(table.caption ? [`**${table.caption}**`, ''] : []),
    row(table.columns),
    `|${table.columns.map(() => ' --- ').join('|')}|`,
    ...table.rows.map(row),
    '',
  ];
}

/** Renders a report built by `buildReport`. The same report always gives the same text. */
export function renderReportMarkdown(report: Report): string {
  const lines: string[] = [`# ${report.title}`, '', `> ${report.simulatedDataNotice}`, '', report.purpose, ''];
  for (const section of report.sections) {
    lines.push(`## ${section.title}`, '');
    for (const paragraph of section.paragraphs) lines.push(paragraphText(paragraph), '');
    for (const table of section.tables) lines.push(...tableLines(table, report.locale));
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
