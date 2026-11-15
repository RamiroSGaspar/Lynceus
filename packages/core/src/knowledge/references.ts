import type { Reference } from './types';

/**
 * Sources behind `KNOWLEDGE`, taken from the source tables of the research
 * documents in `monitoreo-salud-astronautas/investigaciones/`. Only sources that
 * those documents mark as read (in full or in the cited parts) are listed.
 *
 * Ids are descriptive and independent of the per-document ids (`P1`, `N2`...),
 * which collide between documents. Where a research table gives the full title,
 * it is copied; where it only describes the work, the title is that description
 * in English and is written in square brackets, so it is not taken for the real one.
 */
export const REFERENCES: readonly Reference[] = [
  // ---- NASA
  {
    id: 'nasa-sans-evidence-2022',
    title: 'Evidence Report: Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    publisher: 'NASA Human Research Program',
    year: 2022,
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf',
  },
  {
    id: 'nasa-ochmo-sans-2024',
    title: 'OCHMO-MTB-001: Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    publisher: 'NASA Office of the Chief Health and Medical Officer',
    year: 2024,
    url: 'https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf',
  },
  {
    id: 'brunstetter-2017',
    title: '[Introduction to SANS, NASA presentation]',
    publisher: 'NASA Technical Reports Server',
    year: 2017,
    url: 'https://ntrs.nasa.gov/citations/20170009173',
  },
  {
    id: 'nasa-std-3001-vol1-2023',
    title: 'NASA-STD-3001, Volume 1, Revision C',
    publisher: 'NASA',
    year: 2023,
    url: 'https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf',
  },
  {
    id: 'nasa-std-3001-vol2-2026',
    title: 'NASA-STD-3001, Volume 2, Revision F',
    publisher: 'NASA',
    year: 2026,
    url: 'https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf',
  },
  // ---- Eye: peer-reviewed articles
  {
    id: 'macias-2020',
    title: '[Ocular changes in 11 astronauts during and after ~6-month missions]',
    publisher: 'JAMA Ophthalmology',
    year: 2020,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/',
  },
  {
    id: 'laurie-2020',
    title: '[Optic disc edema and choroid in spaceflight and in head-down bed rest]',
    publisher: 'JAMA Ophthalmology',
    year: 2020,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/',
  },
  {
    id: 'pardon-2022',
    title: '[Factors associated with optic disc edema in 31 crew members]',
    publisher: 'JAMA Ophthalmology',
    year: 2022,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/',
  },
  {
    id: 'ferguson-2023',
    title: '[Chorioretinal folds in 36 crew members]',
    publisher: 'PubMed Central (open-access article)',
    year: 2023,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/',
  },
  {
    id: 'brunstetter-2024',
    title: '[Severe case of SANS in a ~6-month mission]',
    publisher: 'JAMA Ophthalmology',
    year: 2024,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11273286/',
  },
  {
    id: 'hearon-2022',
    title: '[Lower body negative pressure in flight: effect on the eye]',
    publisher: 'JAMA Ophthalmology',
    year: 2022,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8662537/',
  },
  {
    id: 'nguyen-2025',
    title: '[Review of SANS by NASA physicians]',
    publisher: 'Progress in Retinal and Eye Research',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12103276/',
  },
  {
    id: 'spectralis-artifacts-2015',
    title: '[Artifacts in Spectralis optic nerve head scans]',
    publisher: 'PubMed Central (open-access article)',
    year: 2015,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4423408/',
  },
  // ---- Brain: peer-reviewed articles
  {
    id: 'jasien-2022',
    title: 'Noninvasive indicators of intracranial pressure before, during, and after long-duration spaceflight',
    publisher: 'PubMed Central (open-access article)',
    year: 2022,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9484990/',
  },
  {
    id: 'marshall-goebel-2019',
    title: 'Assessment of Jugular Venous Blood Flow Stasis and Thrombosis During Spaceflight',
    publisher: 'PubMed Central (open-access article)',
    year: 2019,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6902784/',
  },
  {
    id: 'marshall-goebel-2021',
    title: 'Association of Structural Changes in the Brain and Retina After Long-Duration Spaceflight',
    publisher: 'PubMed Central (open-access article)',
    year: 2021,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8138750/',
  },
  {
    id: 'van-oosterhout-2024',
    title: 'Frequency and Clinical Features of Space Headache',
    publisher: 'PubMed Central (open-access article)',
    year: 2024,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11033988/',
  },
  {
    id: 'dev-2024',
    title: 'Cognitive performance in ISS astronauts on 6-month low earth orbit missions',
    publisher: 'PubMed Central (open-access article)',
    year: 2024,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11614644/',
  },
  {
    id: 'hupfeld-2020',
    title: 'The Impact of 6 and 12 Months in Space on Human Brain Structure and Intracranial Fluid Shifts',
    publisher: 'PubMed Central (open-access article)',
    year: 2020,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7446230/',
  },
  {
    id: 'hupfeld-2022',
    title: 'Longitudinal MRI-visible perivascular space changes with long-duration spaceflight',
    publisher: 'PubMed Central (open-access article)',
    year: 2022,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9072425/',
  },
  // ---- Communicating results
  {
    id: 'fda-ml-transparency-2024',
    title: 'Transparency for Machine Learning-Enabled Medical Devices: Guiding Principles',
    publisher: 'FDA, Health Canada and MHRA',
    year: 2024,
    url: 'https://www.fda.gov/medical-devices/software-medical-device-samd/transparency-machine-learning-enabled-medical-devices-guiding-principles',
  },
  {
    id: 'zikmund-fisher-2025',
    title: '[Evidence behind the IPDAS recommendations on communicating numbers and uncertainty]',
    publisher: 'PubMed Central (open-access article)',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12236432/',
  },
];
