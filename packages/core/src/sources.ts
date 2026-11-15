/**
 * Published sources behind the constants and methods of the core. Ids are the
 * ones used in the research documents (`monitoreo-salud-astronautas/investigaciones/`):
 * `P*` and `N*` from the source table of `sans-oct-base-tecnica.md`, `C*` and `D*`
 * from `sans-spectralis-datos.md`. `Quantity.sources` holds these ids.
 */

export interface Source {
  id: string;
  citation: string;
  url: string;
}

// Citations are the short descriptions of the research documents, translated;
// full titles were not copied there, so they are not invented here.
export const SOURCES: Readonly<Record<string, Source>> = {
  N1: {
    id: 'N1',
    citation: 'NASA Human Research Program, SANS evidence report, 2022',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf',
  },
  N2: {
    id: 'N2',
    citation: 'NASA medical technical brief OCHMO-MTB-001 on SANS, 2024',
    url: 'https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf',
  },
  P1: {
    id: 'P1',
    citation: 'Macias 2020, ocular changes in 11 astronauts',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/',
  },
  P2: {
    id: 'P2',
    citation: 'Laurie 2020, optic disc edema and choroid in flight and in bed rest',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/',
  },
  P3: {
    id: 'P3',
    citation: 'Pardon 2022, factors associated with optic disc edema, 31 crew members',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/',
  },
  P4: {
    id: 'P4',
    citation: 'Ferguson 2023, folds in 36 crew members',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/',
  },
  P5: {
    id: 'P5',
    citation: 'Macias 2021, two crew members of a one-year mission',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8085766/',
  },
  P6: {
    id: 'P6',
    citation: 'Chauhan 2015, minimum rim width and nerve fibre layer in 246 healthy people',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4698808/',
  },
  P7: {
    id: 'P7',
    citation: 'Chiu 2010, automatic segmentation of seven retinal layers (graph search)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3408910/',
  },
  P8: {
    id: 'P8',
    citation: 'Spectralis parameter table in a repeatability study, 2020',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7533739/',
  },
  P10: {
    id: 'P10',
    citation: 'Peripapillary choroid in 57 healthy people, 2015',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4525789/',
  },
  P13: {
    id: 'P13',
    citation: 'Artifacts in Spectralis optic nerve exams, 2015',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4423408/',
  },
  P16: {
    id: 'P16',
    citation: 'Accuracy of Bruch’s membrane opening detection, 2022',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9754118/',
  },
  P17: {
    id: 'P17',
    citation: 'Statistical model of OCT images with a Weibull mixture, 2021',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8515962/',
  },
  P22: {
    id: 'P22',
    citation: 'Outer retinal bands in OCT, 2021',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8718257/',
  },
  C1: {
    id: 'C1',
    citation: 'eyepy, Heyex .vol reader (open source)',
    url: 'https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/he/vol_reader.py',
  },
  C2: {
    id: 'C2',
    citation: 'heyexReader, .vol reader (open source)',
    url: 'https://github.com/ayl/heyexReader/blob/master/heyexReader/volReader.py',
  },
  C3: {
    id: 'C3',
    citation: 'eyepy, intensity transformation for display',
    url: 'https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/core/utils.py',
  },
  D2: {
    id: 'D2',
    citation: 'Rabbani H. Optic nerve head OCT of 7 healthy and 7 glaucoma eyes captured with Heidelberg Spectralis',
    url: 'https://hrabbani.site123.me/available-datasets/onh-based-oct-of-7-healthy-and-7-glaucoma-data-captured-by-heidelberg-spectralis',
  },
};
