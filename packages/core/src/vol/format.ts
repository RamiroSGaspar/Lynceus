/**
 * Byte layout of the Heidelberg `.vol` export, exactly as tables 1.1 to 1.4 of
 * `sans-spectralis-datos.md` give it (from the open readers eyepy [C1] and
 * heyexReader [C2]). Little-endian throughout.
 */
import type { BScanHeader, VolHeader } from '../contract';

export const VOL_HEADER_BYTES = 2048;
export const BSCAN_HEADER_BYTES = 256;
/** Default size of the block that precedes each B-scan image [C1]. */
export const DEFAULT_BSCAN_HDR_SIZE = 61440;
export const VOL_VERSION = 'HSF-OCT-103';
export const BSCAN_VERSION = 'HSF-BS-103';
/** Radial (star) scan pattern code [C1]. */
export const SCAN_PATTERN_RADIAL = 5;

/** "Invalid" marker: the largest 32-bit float, bytes FF FF 7F 7F [C2, C3]. */
export const INVALID_VALUE = 3.4028234663852886e38;

/** Milliseconds between 1601-01-01 and 1970-01-01 (Windows FILETIME epoch). */
const FILETIME_EPOCH_OFFSET_MS = 11644473600000n;
/** Days between 1899-12-30 and 1970-01-01 (OLE date epoch): 25569 [C1, C2]. */
export const OLE_DAYS_AT_UNIX_EPOCH = 25569;

/** True on little-endian hosts (all current browsers and Node builds). */
export const LITTLE_ENDIAN_HOST = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

export class VolFormatError extends Error {
  readonly code: 'truncated' | 'unknown-version' | 'inconsistent-size' | 'invalid-field';
  constructor(code: VolFormatError['code'], message: string) {
    super(message);
    this.name = 'VolFormatError';
    this.code = code;
  }
}

/** Field offsets of the exam header (table 1.2). */
export const VOL_FIELDS = {
  version: { offset: 0, length: 12 },
  sizeX: { offset: 12 },
  numBScans: { offset: 16 },
  sizeZ: { offset: 20 },
  scaleX: { offset: 24 },
  distance: { offset: 32 },
  scaleZ: { offset: 40 },
  sizeXSlo: { offset: 48 },
  sizeYSlo: { offset: 52 },
  scaleXSlo: { offset: 56 },
  scaleYSlo: { offset: 64 },
  fieldSizeSlo: { offset: 72 },
  scanFocus: { offset: 76 },
  scanPosition: { offset: 84, length: 4 },
  examTime: { offset: 88 },
  scanPattern: { offset: 96 },
  bscanHdrSize: { offset: 100 },
  id: { offset: 104, length: 16 },
  referenceId: { offset: 120, length: 16 },
  pid: { offset: 136 },
  patientId: { offset: 140, length: 24 },
  dob: { offset: 164 },
  vid: { offset: 172 },
  visitId: { offset: 176, length: 24 },
  visitDate: { offset: 200 },
  gridType: { offset: 208 },
  gridOffset: { offset: 212 },
  gridType1: { offset: 216 },
  gridOffset1: { offset: 220 },
  progId: { offset: 224, length: 34 },
  reserved: { offset: 258, length: 1790 },
} as const;

/** Field offsets of the B-scan header (table 1.3). */
export const BSCAN_FIELDS = {
  version: { offset: 0, length: 12 },
  bscanHdrSize: { offset: 12 },
  startX: { offset: 16 },
  startY: { offset: 24 },
  endX: { offset: 32 },
  endY: { offset: 40 },
  numSeg: { offset: 48 },
  offSeg: { offset: 52 },
  quality: { offset: 56 },
  shift: { offset: 60 },
  ivTrafo: { offset: 64, length: 6 },
  reserved: { offset: 88, length: 168 },
} as const;

function writeAscii(bytes: Uint8Array, offset: number, length: number, text: string): void {
  if (text.length > length) throw new RangeError(`Text "${text}" longer than its ${length}-byte field`);
  for (let i = 0; i < length; i++) {
    if (i < text.length) {
      const c = text.charCodeAt(i);
      if (c > 127) throw new RangeError(`Text "${text}" is not ASCII`);
      bytes[offset + i] = c;
    } else {
      bytes[offset + i] = 0;
    }
  }
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const c = bytes[offset + i]!;
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Unix milliseconds → 100-ns ticks since 1601-01-01. */
export function msToFiletime(ms: number): bigint {
  const whole = Math.floor(ms);
  const frac = Math.round((ms - whole) * 10000);
  return (BigInt(whole) + FILETIME_EPOCH_OFFSET_MS) * 10000n + BigInt(frac);
}

/** 100-ns ticks since 1601-01-01 → Unix milliseconds. */
export function filetimeToMs(ticks: bigint): number {
  const ms = ticks / 10000n - FILETIME_EPOCH_OFFSET_MS;
  return Number(ms) + Number(ticks % 10000n) / 10000;
}

/** Unix milliseconds → days since 1899-12-30. */
export function msToOleDays(ms: number): number {
  return ms / 86400000 + OLE_DAYS_AT_UNIX_EPOCH;
}

export function oleDaysToMs(days: number): number {
  return (days - OLE_DAYS_AT_UNIX_EPOCH) * 86400000;
}

export function encodeVolHeader(h: VolHeader): Uint8Array {
  const bytes = new Uint8Array(VOL_HEADER_BYTES);
  const dv = view(bytes);
  const F = VOL_FIELDS;
  writeAscii(bytes, F.version.offset, F.version.length, h.version);
  dv.setInt32(F.sizeX.offset, h.sizeX, true);
  dv.setInt32(F.numBScans.offset, h.numBScans, true);
  dv.setInt32(F.sizeZ.offset, h.sizeZ, true);
  dv.setFloat64(F.scaleX.offset, h.scaleXMm, true);
  dv.setFloat64(F.distance.offset, h.distanceMm, true);
  dv.setFloat64(F.scaleZ.offset, h.scaleZMm, true);
  dv.setInt32(F.sizeXSlo.offset, h.sizeXSlo, true);
  dv.setInt32(F.sizeYSlo.offset, h.sizeYSlo, true);
  dv.setFloat64(F.scaleXSlo.offset, h.scaleXSloMm, true);
  dv.setFloat64(F.scaleYSlo.offset, h.scaleYSloMm, true);
  dv.setInt32(F.fieldSizeSlo.offset, h.fieldSizeSloDeg, true);
  dv.setFloat64(F.scanFocus.offset, h.scanFocusD, true);
  writeAscii(bytes, F.scanPosition.offset, F.scanPosition.length, h.scanPosition);
  dv.setBigUint64(F.examTime.offset, msToFiletime(h.examTimeMs), true);
  dv.setInt32(F.scanPattern.offset, h.scanPattern, true);
  dv.setInt32(F.bscanHdrSize.offset, h.bscanHdrSize, true);
  writeAscii(bytes, F.id.offset, F.id.length, h.id);
  writeAscii(bytes, F.referenceId.offset, F.referenceId.length, h.referenceId);
  dv.setInt32(F.pid.offset, h.pid, true);
  writeAscii(bytes, F.patientId.offset, F.patientId.length, h.patientId);
  dv.setFloat64(F.dob.offset, h.dobDays, true);
  dv.setInt32(F.vid.offset, h.vid, true);
  writeAscii(bytes, F.visitId.offset, F.visitId.length, h.visitId);
  dv.setFloat64(F.visitDate.offset, h.visitDateDays, true);
  dv.setInt32(F.gridType.offset, h.gridType, true);
  dv.setInt32(F.gridOffset.offset, h.gridOffset, true);
  dv.setInt32(F.gridType1.offset, h.gridType1, true);
  dv.setInt32(F.gridOffset1.offset, h.gridOffset1, true);
  writeAscii(bytes, F.progId.offset, F.progId.length, h.progId);
  return bytes;
}

export function decodeVolHeader(bytes: Uint8Array): VolHeader {
  if (bytes.byteLength < VOL_HEADER_BYTES) {
    throw new VolFormatError('truncated', `File is ${bytes.byteLength} bytes, shorter than the ${VOL_HEADER_BYTES}-byte header`);
  }
  const dv = view(bytes);
  const F = VOL_FIELDS;
  const scanPosition = readAscii(bytes, F.scanPosition.offset, F.scanPosition.length);
  if (scanPosition !== 'OD' && scanPosition !== 'OS') {
    throw new VolFormatError('invalid-field', `ScanPosition "${scanPosition}" is neither OD nor OS`);
  }
  return {
    version: readAscii(bytes, F.version.offset, F.version.length),
    sizeX: dv.getInt32(F.sizeX.offset, true),
    numBScans: dv.getInt32(F.numBScans.offset, true),
    sizeZ: dv.getInt32(F.sizeZ.offset, true),
    scaleXMm: dv.getFloat64(F.scaleX.offset, true),
    distanceMm: dv.getFloat64(F.distance.offset, true),
    scaleZMm: dv.getFloat64(F.scaleZ.offset, true),
    sizeXSlo: dv.getInt32(F.sizeXSlo.offset, true),
    sizeYSlo: dv.getInt32(F.sizeYSlo.offset, true),
    scaleXSloMm: dv.getFloat64(F.scaleXSlo.offset, true),
    scaleYSloMm: dv.getFloat64(F.scaleYSlo.offset, true),
    fieldSizeSloDeg: dv.getInt32(F.fieldSizeSlo.offset, true),
    scanFocusD: dv.getFloat64(F.scanFocus.offset, true),
    scanPosition,
    examTimeMs: filetimeToMs(dv.getBigUint64(F.examTime.offset, true)),
    scanPattern: dv.getInt32(F.scanPattern.offset, true),
    bscanHdrSize: dv.getInt32(F.bscanHdrSize.offset, true),
    id: readAscii(bytes, F.id.offset, F.id.length),
    referenceId: readAscii(bytes, F.referenceId.offset, F.referenceId.length),
    pid: dv.getInt32(F.pid.offset, true),
    patientId: readAscii(bytes, F.patientId.offset, F.patientId.length),
    dobDays: dv.getFloat64(F.dob.offset, true),
    vid: dv.getInt32(F.vid.offset, true),
    visitId: readAscii(bytes, F.visitId.offset, F.visitId.length),
    visitDateDays: dv.getFloat64(F.visitDate.offset, true),
    gridType: dv.getInt32(F.gridType.offset, true),
    gridOffset: dv.getInt32(F.gridOffset.offset, true),
    gridType1: dv.getInt32(F.gridType1.offset, true),
    gridOffset1: dv.getInt32(F.gridOffset1.offset, true),
    progId: readAscii(bytes, F.progId.offset, F.progId.length),
  };
}

/** Bytes of one B-scan block: header, layer lines, padding up to `bscanHdrSize`, then the image. */
export function bscanBlockBytes(header: VolHeader): number {
  return header.bscanHdrSize + header.sizeX * header.sizeZ * 4;
}

/** Total file size: formula of table 1.5. */
export function volFileBytes(header: VolHeader): number {
  return VOL_HEADER_BYTES + header.sizeXSlo * header.sizeYSlo + header.numBScans * bscanBlockBytes(header);
}

export function encodeBScanBlock(exam: VolHeader, h: BScanHeader, segLines: readonly Float32Array[], pixels: Float32Array): Uint8Array {
  const bytes = new Uint8Array(bscanBlockBytes(exam));
  const dv = view(bytes);
  const F = BSCAN_FIELDS;
  if (h.numSeg !== segLines.length) throw new RangeError(`numSeg ${h.numSeg} but ${segLines.length} layer lines`);
  if (h.offSeg + h.numSeg * exam.sizeX * 4 > exam.bscanHdrSize) throw new RangeError('Layer lines do not fit in the B-scan header block');
  if (pixels.length !== exam.sizeX * exam.sizeZ) throw new RangeError('Pixel count does not match SizeX × SizeZ');
  writeAscii(bytes, F.version.offset, F.version.length, h.version);
  dv.setInt32(F.bscanHdrSize.offset, h.bscanHdrSize, true);
  dv.setFloat64(F.startX.offset, h.startXMm, true);
  dv.setFloat64(F.startY.offset, h.startYMm, true);
  dv.setFloat64(F.endX.offset, h.endXMm, true);
  dv.setFloat64(F.endY.offset, h.endYMm, true);
  dv.setInt32(F.numSeg.offset, h.numSeg, true);
  dv.setInt32(F.offSeg.offset, h.offSeg, true);
  dv.setFloat32(F.quality.offset, h.qualityDb, true);
  dv.setInt32(F.shift.offset, h.shift, true);
  for (let i = 0; i < 6; i++) dv.setFloat32(F.ivTrafo.offset + 4 * i, h.ivTrafo[i] ?? 0, true);
  for (let s = 0; s < segLines.length; s++) {
    const line = segLines[s]!;
    const base = h.offSeg + s * exam.sizeX * 4;
    for (let x = 0; x < exam.sizeX; x++) dv.setFloat32(base + 4 * x, line[x]!, true);
  }
  const imageOffset = exam.bscanHdrSize;
  if (LITTLE_ENDIAN_HOST) {
    bytes.set(new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength), imageOffset);
  } else {
    for (let i = 0; i < pixels.length; i++) dv.setFloat32(imageOffset + 4 * i, pixels[i]!, true);
  }
  return bytes;
}

export function decodeBScanHeader(exam: VolHeader, block: Uint8Array, index: number): BScanHeader {
  const dv = view(block);
  const F = BSCAN_FIELDS;
  const version = readAscii(block, F.version.offset, F.version.length);
  if (!/^HSF-BS-1\d\d$/.test(version)) throw new VolFormatError('unknown-version', `B-scan ${index}: unknown version "${version}"`);
  const bscanHdrSize = dv.getInt32(F.bscanHdrSize.offset, true);
  if (bscanHdrSize !== exam.bscanHdrSize) {
    throw new VolFormatError('inconsistent-size', `B-scan ${index}: BScanHdrSize ${bscanHdrSize} differs from the exam's ${exam.bscanHdrSize}`);
  }
  const numSeg = dv.getInt32(F.numSeg.offset, true);
  const offSeg = dv.getInt32(F.offSeg.offset, true);
  if (numSeg < 0 || offSeg < BSCAN_HEADER_BYTES || offSeg + numSeg * exam.sizeX * 4 > exam.bscanHdrSize) {
    throw new VolFormatError('inconsistent-size', `B-scan ${index}: ${numSeg} layer lines at offset ${offSeg} do not fit in ${exam.bscanHdrSize} bytes`);
  }
  const ivTrafo: number[] = [];
  for (let i = 0; i < 6; i++) ivTrafo.push(dv.getFloat32(F.ivTrafo.offset + 4 * i, true));
  return {
    version,
    bscanHdrSize,
    startXMm: dv.getFloat64(F.startX.offset, true),
    startYMm: dv.getFloat64(F.startY.offset, true),
    endXMm: dv.getFloat64(F.endX.offset, true),
    endYMm: dv.getFloat64(F.endY.offset, true),
    numSeg,
    offSeg,
    qualityDb: dv.getFloat32(F.quality.offset, true),
    shift: dv.getInt32(F.shift.offset, true),
    ivTrafo,
  };
}
