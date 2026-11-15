/**
 * Reading and writing whole `.vol` exams, block by block, so a 78 MB exam never
 * has to be decoded at once.
 */
import type { BScan, ExamSource, VolHeader } from '../contract';
import {
  BSCAN_HEADER_BYTES,
  LITTLE_ENDIAN_HOST,
  VOL_HEADER_BYTES,
  VOL_FIELDS,
  VolFormatError,
  bscanBlockBytes,
  decodeBScanHeader,
  decodeVolHeader,
  encodeBScanBlock,
  encodeVolHeader,
  volFileBytes,
} from './format';

/** Sanity limits: far above any Spectralis export, low enough to reject garbage. */
const MAX_DIMENSION = 8192;
const MAX_BSCANS = 4096;

function checkHeader(h: VolHeader): void {
  const positive = (v: number, name: string, max: number): void => {
    if (!Number.isInteger(v) || v <= 0 || v > max) throw new VolFormatError('inconsistent-size', `${name} = ${v} is not a valid size`);
  };
  positive(h.sizeX, 'SizeX', MAX_DIMENSION);
  positive(h.sizeZ, 'SizeZ', MAX_DIMENSION);
  positive(h.numBScans, 'NumBScans', MAX_BSCANS);
  positive(h.sizeXSlo, 'SizeXSlo', MAX_DIMENSION);
  positive(h.sizeYSlo, 'SizeYSlo', MAX_DIMENSION);
  if (!Number.isInteger(h.bscanHdrSize) || h.bscanHdrSize < BSCAN_HEADER_BYTES || h.bscanHdrSize > 64 * 1024 * 1024) {
    throw new VolFormatError('inconsistent-size', `BScanHdrSize = ${h.bscanHdrSize} is smaller than the ${BSCAN_HEADER_BYTES}-byte B-scan header`);
  }
  if (!(h.scaleXMm > 0) || !(h.scaleZMm > 0)) throw new VolFormatError('inconsistent-size', 'Pixel scales must be positive');
}

/** Copies `length` little-endian float32 values starting at `offset` of `bytes`. */
function readFloat32(bytes: Uint8Array, offset: number, length: number): Float32Array {
  const start = bytes.byteOffset + offset;
  if (LITTLE_ENDIAN_HOST && start % 4 === 0) {
    return new Float32Array(bytes.buffer.slice(start, start + 4 * length));
  }
  const out = new Float32Array(length);
  const dv = new DataView(bytes.buffer, start, 4 * length);
  for (let i = 0; i < length; i++) out[i] = dv.getFloat32(4 * i, true);
  return out;
}

/**
 * Parses a `.vol` file. The header is checked at once; each B-scan is decoded
 * only when asked for. Throws `VolFormatError` for a cut file, an unknown
 * version or sizes that do not add up.
 */
export function readVol(bytes: Uint8Array): ExamSource {
  if (bytes.byteLength < VOL_HEADER_BYTES) {
    throw new VolFormatError('truncated', `File is ${bytes.byteLength} bytes, shorter than the ${VOL_HEADER_BYTES}-byte header`);
  }
  let version = '';
  for (let i = 0; i < VOL_FIELDS.version.length && bytes[i] !== 0; i++) version += String.fromCharCode(bytes[i]!);
  if (!/^HSF-OCT-1\d\d$/.test(version)) throw new VolFormatError('unknown-version', `Unknown .vol version "${version}"`);
  const header = decodeVolHeader(bytes);
  checkHeader(header);
  const expected = volFileBytes(header);
  if (bytes.byteLength < expected) {
    throw new VolFormatError('truncated', `File is ${bytes.byteLength} bytes; its header describes ${expected}`);
  }
  const sloBytes = header.sizeXSlo * header.sizeYSlo;
  const slo = bytes.subarray(VOL_HEADER_BYTES, VOL_HEADER_BYTES + sloBytes);
  const blockBytes = bscanBlockBytes(header);
  const firstBlock = VOL_HEADER_BYTES + sloBytes;
  return {
    header,
    slo,
    bscan(index: number): BScan {
      if (!Number.isInteger(index) || index < 0 || index >= header.numBScans) throw new RangeError(`B-scan ${index} out of range`);
      const start = firstBlock + index * blockBytes;
      const block = bytes.subarray(start, start + blockBytes);
      const bh = decodeBScanHeader(header, block, index);
      const segLines: Float32Array[] = [];
      for (let s = 0; s < bh.numSeg; s++) segLines.push(readFloat32(block, bh.offSeg + s * header.sizeX * 4, header.sizeX));
      const pixels = readFloat32(block, header.bscanHdrSize, header.sizeX * header.sizeZ);
      return { index, header: bh, segLines, pixels };
    },
  };
}

/** The exam as a sequence of byte blocks: header, fundus image, then one block per B-scan. */
export function* writeVolBlocks(exam: ExamSource): Generator<Uint8Array> {
  const h = exam.header;
  checkHeader(h);
  yield encodeVolHeader(h);
  if (exam.slo.length !== h.sizeXSlo * h.sizeYSlo) throw new RangeError('Fundus image size does not match SizeXSlo × SizeYSlo');
  yield exam.slo;
  for (let k = 0; k < h.numBScans; k++) {
    const b = exam.bscan(k);
    yield encodeBScanBlock(h, b.header, b.segLines, b.pixels);
  }
}

/** The whole `.vol` file in one array (about 78 MB for the NASA radial exam). */
export function writeVol(exam: ExamSource): Uint8Array {
  const out = new Uint8Array(volFileBytes(exam.header));
  let offset = 0;
  for (const block of writeVolBlocks(exam)) {
    out.set(block, offset);
    offset += block.length;
  }
  return out;
}
