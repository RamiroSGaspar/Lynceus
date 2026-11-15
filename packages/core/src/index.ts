export * from './product';
export type * from './contract';
export * from './rules/levels';
export * from './knowledge';

// Instrument constants and sources
export * from './constants';
export { SOURCES, type Source } from './sources';

// Crew, mission and ground truth (ground truth: tests, validation and transparency view only)
export { MISSION, CREW } from './eye/crew';
export { groundTruth } from './eye/groundTruth';
export { SECTORS, sectorOf } from './sectors';

// Virtual instrument
export { acquire, type AcquireOptions } from './instrument/acquire';
export { SCRIPTED_EVENTS } from './instrument/capture';
export { qualityDb } from './quality';

// Measurement engine (sees only the exam)
export { analyzeExam, analyzeExamSteps, summarize, compareWithBaseline, ENGINE_VERSION } from './engine/analyze';

// Exam file format
export { readVol, writeVol, writeVolBlocks } from './vol/io';
export { toDisplayGray, displayGray } from './vol/display';
export { INVALID_VALUE, VolFormatError, volFileBytes } from './vol/format';

// Rules, texts, provisional history and report (specification 04).
export * from './rules/sources';
export * from './rules/thresholds';
export * from './rules/errorModel';
export * from './rules/probability';
export * from './rules/assess';
export { getHistory, PROVISIONAL_ENGINE_VERSION } from './dataset/provisional';
export * from './texts';
export * from './report';
