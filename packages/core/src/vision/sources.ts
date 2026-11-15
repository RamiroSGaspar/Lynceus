/**
 * Published sources behind the constants of the vision tests. Ids are those of the
 * source table of `monitoreo-salud-astronautas/investigaciones/pruebas-de-vision-en-pantalla.md`
 * (section 8), prefixed with `PV-` because other research documents reuse the same short ids.
 */
export const VISION_SOURCES = {
  'PV-F1': {
    citation: 'Bach M. FrACT10 (Freiburg Vision Test): manual and checklist.',
    url: 'https://michaelbach.de/fract/manual.html',
  },
  'PV-B3': {
    citation: 'Bach M. Optimal number of trials in FrACT. Graefes Arch Clin Exp Ophthalmol, 2025.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11868300/',
  },
  'PV-L1': {
    citation: 'Li Q et al. Controlling for participants\u2019 viewing distance in large-scale online studies (virtual chinrest). Sci Rep, 2020.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6976612/',
  },
  'PV-A1': {
    citation: 'Amsler M. Earliest symptoms of diseases of the macula. Br J Ophthalmol, 1953.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1324189/',
  },
  'PV-C1': {
    citation: 'Crossland M, Rubin G. The Amsler chart: absence of evidence is not evidence of absence. Br J Ophthalmol, 2007.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1857645/',
  },
  'PV-F2': {
    citation: 'Faes L et al. Diagnostic accuracy of the Amsler grid and preferential hyperacuity perimetry. Eye, 2014.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4094801/',
  },
  'PV-B1': {
    citation: 'Bjerager J et al. Diagnostic accuracy of the Amsler grid test for detecting neovascular AMD. JAMA Ophthalmol, 2023.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12278824/',
  },
  'PV-N2': {
    citation: 'NASA. Evidence Report: Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS), 2017.',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/SANS.pdf',
  },
  'PV-Q4': {
    citation: 'van Oosterhout WPJ et al. Headache in astronauts on the International Space Station. Neurology, 2024.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11033988/',
  },
} as const;

export type VisionSourceId = keyof typeof VISION_SOURCES;
