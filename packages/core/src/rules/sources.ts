/**
 * Published sources behind the rules: thresholds, follow-up and wording. The ids
 * are the ones written in `Quantity.sources` and `NextStep.sources` by the rules.
 *
 * They are names, not the `P*` / `N*` codes of the research documents, because
 * those codes change from one document to another (P3 is Laurie 2020 in
 * `sans-evolucion-y-logica-clinica.md` and Pardon 2022 in `sans-oct-base-tecnica.md`).
 * Citations are the short descriptions of the research documents, translated;
 * links are the ones listed there.
 */
export interface RuleSource {
  id: string;
  citation: string;
  url: string;
}

export const RULE_SOURCES = {
  laurie2020: {
    id: 'laurie2020',
    citation: 'Laurie 2020, JAMA Ophthalmology: optic disc swelling and choroid in flight and in bed rest',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/',
  },
  'nasa-mtb-2024': {
    id: 'nasa-mtb-2024',
    citation: 'NASA medical technical brief OCHMO-MTB-001 on SANS, 2024',
    url: 'https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf',
  },
  ferguson2023: {
    id: 'ferguson2023',
    citation: 'Ferguson 2023: folds in 36 crew members',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/',
  },
  brunstetter2024: {
    id: 'brunstetter2024',
    citation: 'Brunstetter 2024, JAMA Ophthalmology: case report of one astronaut followed in flight with extra exams',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11273286/',
  },
  nguyen2025: {
    id: 'nguyen2025',
    citation: 'Nguyen and others 2025, Progress in Retinal and Eye Research: review with NASA’s table of thresholds',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12103276/',
  },
  'nasa-evidence-2022': {
    id: 'nasa-evidence-2022',
    citation: 'NASA Human Research Program, SANS evidence report, 2022',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf',
  },
  'nasa-evidence-2017': {
    id: 'nasa-evidence-2017',
    citation: 'NASA Human Research Program, SANS evidence report, 2017',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/SANS.pdf',
  },
  bach2025: {
    id: 'bach2025',
    citation: 'Bach 2025, Graefe’s Archive: number of trials and repeatability of the Freiburg acuity test',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11868300/',
  },
  vanoosterhout2024: {
    id: 'vanoosterhout2024',
    citation: 'van Oosterhout 2024, Neurology: headache in astronauts on the station',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11033988/',
  },
} as const satisfies Readonly<Record<string, RuleSource>>;

export type RuleSourceId = keyof typeof RULE_SOURCES;
