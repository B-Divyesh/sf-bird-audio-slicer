import assert from 'node:assert/strict';
import test from 'node:test';
import { clock, parseWavHeader, planFixed } from '../src/wav.mjs';

function wavHeader({ seconds = 25, sampleRate = 8000, channels = 1, bits = 16 } = {}) {
  const blockAlign = channels * bits / 8;
  const bytes = seconds * sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const put = (offset, value) => [...value].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0)));
  put(0, 'RIFF'); view.setUint32(4, bytes + 36, true); put(8, 'WAVE'); put(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true); view.setUint16(34, bits, true); put(36, 'data'); view.setUint32(40, bytes, true);
  return { buffer, fileSize: bytes + 44 };
}

test('reads a PCM WAV header without reading audio', () => {
  const fixture = wavHeader();
  const result = parseWavHeader(fixture.buffer, fixture.fileSize);
  assert.equal(result.duration, 25);
  assert.equal(result.sampleRate, 8000);
  assert.equal(result.channels, 1);
});

test('plans a final remainder and stable timestamps', () => {
  assert.deepEqual(planFixed(25, 10).map(({ start, end }) => [start, end]), [[0, 10], [10, 20], [20, 25]]);
  assert.equal(clock(90061), '25:01:01');
});

test('rejects invalid input and unsafe clip lengths', () => {
  assert.throws(() => parseWavHeader(new ArrayBuffer(44), 44), /RIFF or RF64/);
  assert.throws(() => planFixed(25, 2), /between 10/);
});
