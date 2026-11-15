/**
 * PROVISIONAL. The fictional mission and crew of the scenario, from section 4 of
 * `especificaciones/01-nucleo.md`. The core will export the same names from its
 * own module; this file is retired when both are joined.
 *
 * Simulated data: every name and history here is invented.
 */
import type { CrewMember, Mission } from './contract';

export const MISSION: Mission = {
  // The `SIM-` prefix marks the mission as simulated, as `patientId` does for the crew.
  name: 'SIM-180',
  durationDays: 180,
  launchDateIso: '2026-05-20',
  // NASA's routine in-flight calendar for this mission length: flight days 30 and 90,
  // then every 90 days and 30 days before return (sans-evolucion-y-logica-clinica.md, B2).
  routineControlDays: [30, 90, 150],
};

export const CREW: readonly CrewMember[] = [
  {
    id: 'A',
    name: 'Kofi Mensah',
    role: { en: 'Flight engineer', es: 'Ingeniero de vuelo' },
    ageYears: 43,
    sex: 'M',
    patientId: 'SIM-CREW-A',
  },
  {
    id: 'B',
    name: 'Elena Voss',
    role: { en: 'Commander', es: 'Comandante' },
    ageYears: 47,
    sex: 'F',
    patientId: 'SIM-CREW-B',
  },
  {
    id: 'C',
    name: 'Ravi Anand',
    role: { en: 'Flight engineer', es: 'Ingeniero de vuelo' },
    ageYears: 51,
    sex: 'M',
    patientId: 'SIM-CREW-C',
  },
  {
    id: 'D',
    name: 'Lucía Ferreyra',
    role: { en: 'Mission specialist', es: 'Especialista de misión' },
    ageYears: 39,
    sex: 'F',
    patientId: 'SIM-CREW-D',
  },
];
