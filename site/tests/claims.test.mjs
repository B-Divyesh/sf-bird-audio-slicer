import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { closeSync, cpSync, existsSync, ftruncateSync, mkdtempSync, openSync, readFileSync, readdirSync, unlinkSync, writeFileSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';

const root = new URL('../..', import.meta.url).pathname;
const bin = join(root, 'target/debug/nightjar');
const wav = join(root, 'examples/nightjar-demo.wav');
const flac = join(root, 'examples/nightjar-demo.flac');
const temp = () => mkdtempSync(join(tmpdir(), 'nightjar-claim-'));
const run = (args, options = {}) => spawnSync(bin, args, { encoding: 'utf8', ...options });
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

function slice(input, output, extra = []) {
  const result = run(['--json', 'slice', input, '--output', output, '--chunk-seconds', '10', ...extra]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function floatWav(path) {
  const frames = 8_000 * 10;
  const dataBytes = frames * 4;
  const data = Buffer.alloc(44 + dataBytes);
  data.write('RIFF', 0); data.writeUInt32LE(dataBytes + 36, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(3, 20);
  data.writeUInt16LE(1, 22); data.writeUInt32LE(8_000, 24); data.writeUInt32LE(32_000, 28);
  data.writeUInt16LE(4, 32); data.writeUInt16LE(32, 34); data.write('data', 36); data.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < frames; i += 1) data.writeFloatLE(Math.sin(i * Math.PI / 20) * 0.2, 44 + i * 4);
  writeFileSync(path, data);
}

function sparseWav(path, seconds) {
  const dataBytes = seconds * 8_000 * 2;
  const data = Buffer.alloc(44);
  data.write('RIFF', 0); data.writeUInt32LE(dataBytes + 36, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22); data.writeUInt32LE(8_000, 24); data.writeUInt32LE(16_000, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(dataBytes, 40);
  const fd = openSync(path, 'w'); ftruncateSync(fd, 44 + dataBytes); writeSync(fd, data, 0, 44, 0); closeSync(fd);
}

function controlledSilenceWav(path) {
  const frames = 20 * 8_000;
  const data = Buffer.alloc(44 + frames * 2);
  data.write('RIFF', 0); data.writeUInt32LE(frames * 2 + 36, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22); data.writeUInt32LE(8_000, 24); data.writeUInt32LE(16_000, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(frames * 2, 40);
  for (let frame = 0; frame < frames; frame += 1) {
    const sample = frame >= 8 * 8_000 && frame < 8.5 * 8_000 ? 0 : Math.sin(frame * Math.PI / 20) * 8_000;
    data.writeInt16LE(sample, 44 + frame * 2);
  }
  writeFileSync(path, data);
}

test('@claim:cli-demo bundled demo creates two clips in a new temporary directory', () => {
  const result = run(['demo']);
  assert.equal(result.status, 0, result.stderr);
  const directory = result.stdout.split('\n').find((line) => line.startsWith('Demo files: '))?.slice(12);
  assert.ok(directory && existsSync(join(directory, 'manifest.json')));
  assert.equal(JSON.parse(readFileSync(join(directory, 'manifest.json'))).chunks.length, 2);
});

test('@claim:cli-core-outputs WAV, float WAV, and FLAC produce decodable WAV clips and documented files', () => {
  const dir = temp();
  const float = join(dir, 'float.wav');
  floatWav(float);
  for (const [name, input] of [['pcm', wav], ['float', float], ['flac', flac]]) {
    const output = join(dir, name);
    slice(input, output);
    const files = readdirSync(output);
    for (const expected of ['manifest.json', 'queue.csv', '.nightjar-state.json', 'clip_0001_00-00-00.wav', 'clip_0001_00-00-00.svg']) assert.ok(files.includes(expected), `${name}: ${expected}`);
    const inspect = run(['--json', 'inspect', join(output, 'clip_0001_00-00-00.wav')]);
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.equal(JSON.parse(inspect.stdout).format, 'WAV');
  }
});

test('@claim:resume-repair complete clips are reused while missing and incomplete clips are repaired', () => {
  const dir = temp();
  const output = join(dir, 'queue');
  slice(wav, output);
  const first = join(output, 'clip_0001_00-00-00.wav');
  const second = join(output, 'clip_0002_00-00-10.wav');
  const firstHash = sha(first);
  writeFileSync(second, 'incomplete');
  const rerun = slice(wav, output);
  assert.equal(rerun.chunks_reused, 1);
  assert.equal(sha(first), firstHash);
  assert.ok(readFileSync(second).length > 44);
  const recoveredHashes = [sha(first), sha(second)];
  unlinkSync(join(output, '.nightjar-state.json'));
  const recovered = slice(wav, output);
  assert.equal(recovered.chunks_reused, 2);
  assert.deepEqual([sha(first), sha(second)], recoveredHashes);
  unlinkSync(first);
  const missing = slice(wav, output);
  assert.equal(missing.chunks_reused, 1);
  assert.ok(readFileSync(first).length > 44);
});

test('@claim:silence-boundaries silence mode chooses the quietest half-second within the search window', () => {
  const dir = temp();
  const input = join(dir, 'controlled.wav');
  controlledSilenceWav(input);
  const output = join(dir, 'queue');
  slice(input, output, ['--mode', 'silence', '--search-window-seconds', '2']);
  const manifest = JSON.parse(readFileSync(join(output, 'manifest.json')));
  const boundary = manifest.chunks[1].start_seconds;
  assert.equal(boundary, 8.25);
});

test('@claim:fixed-three-minute fixed mode creates two 180-second clips and the final remainder', () => {
  const dir = temp(); const input = join(dir, '370-seconds.wav'); const output = join(dir, 'queue');
  sparseWav(input, 370);
  const result = run(['--json', 'slice', input, '--output', output, '--chunk-seconds', '180', '--no-thumbnails']);
  assert.equal(result.status, 0, result.stderr);
  const chunks = JSON.parse(readFileSync(join(output, 'manifest.json'))).chunks;
  assert.deepEqual(chunks.map(({ start_seconds, end_seconds }) => [start_seconds, end_seconds]), [[0, 180], [180, 360], [360, 370]]);
});

test('@claim:inspect-details inspect reports format, duration, channels, sample rate, and file size for WAV and FLAC', () => {
  for (const input of [wav, flac]) {
    const result = run(['--json', 'inspect', input]);
    assert.equal(result.status, 0, result.stderr);
    const data = JSON.parse(result.stdout);
    assert.ok(['WAV', 'FLAC'].includes(data.format));
    assert.equal(data.duration_seconds, 20);
    assert.equal(data.channels, 1);
    assert.equal(data.sample_rate_hz, 8_000);
    assert.equal(data.file_bytes, readFileSync(input).length);
  }
});

test('@claim:clip-length-limits accepts 10 and 3,600 seconds and rejects 9 and 3,601 seconds', () => {
  for (const value of ['10', '3600']) assert.equal(run(['slice', wav, '--output', join(temp(), 'out'), '--chunk-seconds', value, '--no-thumbnails']).status, 0);
  for (const value of ['9', '3601']) assert.equal(run(['--json', 'slice', wav, '--output', join(temp(), 'out'), '--chunk-seconds', value]).status, 2);
});

test('@claim:manifest-contract manifest schema, redaction, clip names, and CSV rows match the documented contract', () => {
  const dir = temp();
  const input = join(dir, 'SecretMarsh_51.501N_-0.142W.wav');
  cpSync(wav, input);
  const before = sha(input);
  const output = join(dir, 'queue');
  slice(input, output);
  const manifestText = readFileSync(join(output, 'manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestText);
  const schema = JSON.parse(readFileSync(join(root, 'schema/nightjar-manifest-v1.schema.json')));
  assert.equal(new Ajv2020({ strict: false }).compile(schema)(manifest), true);
  assert.equal(manifest.schema, 'nightjar-manifest/v1');
  assert.equal(manifest.source.name, null); assert.equal(manifest.source.path, null);
  assert.ok(!manifestText.includes(basename(input)));
  assert.deepEqual(manifest.chunks.map((chunk) => chunk.file), ['clip_0001_00-00-00.wav', 'clip_0002_00-00-10.wav']);
  assert.equal(readFileSync(join(output, 'queue.csv'), 'utf8').trim().split('\n').length, manifest.chunks.length + 1);
  const jq = execFileSync('jq', ['-r', '.chunks[] | select(.status == "ready") | .file', join(output, 'manifest.json')], { encoding: 'utf8' });
  assert.deepEqual(jq.trim().split('\n'), manifest.chunks.map((chunk) => chunk.file));
  assert.equal(sha(input), before);
  assert.deepEqual(readdirSync(dir).sort(), ['SecretMarsh_51.501N_-0.142W.wav', 'queue']);
  const hourInput = join(temp(), 'over-an-hour.wav'); const hourOutput = join(temp(), 'queue');
  sparseWav(hourInput, 3_601);
  const hourResult = run(['--json', 'slice', hourInput, '--output', hourOutput, '--chunk-seconds', '3600', '--no-thumbnails']);
  assert.equal(hourResult.status, 0, hourResult.stderr);
  assert.ok(existsSync(join(hourOutput, 'clip_0002_01-00-00.wav')));
});

test('@claim:cli-options no-thumbnails, force, source-path opt-in, and exit codes behave as documented', () => {
  const dir = temp();
  const output = join(dir, 'queue');
  slice(wav, output, ['--no-thumbnails']);
  assert.ok(!readdirSync(output).some((file) => file.endsWith('.svg')));
  const incompatible = run(['--json', 'slice', wav, '--output', output, '--chunk-seconds', '11']);
  assert.equal(incompatible.status, 4); assert.equal(JSON.parse(incompatible.stdout).exit_code, 4);
  const forced = run(['--json', 'slice', wav, '--output', output, '--chunk-seconds', '11', '--force', '--include-source-path']);
  assert.equal(forced.status, 0, forced.stderr);
  const manifest = JSON.parse(readFileSync(join(output, 'manifest.json')));
  assert.equal(manifest.source.name, 'nightjar-demo.wav'); assert.ok(manifest.source.path.endsWith('nightjar-demo.wav'));
  const invalid = run(['--json', 'slice', wav, '--output', join(dir, 'x'), '--chunk-seconds', '9']);
  assert.equal(invalid.status, 2); assert.equal(JSON.parse(invalid.stdout).exit_code, 2); assert.equal(invalid.stderr, '');
  const missing = run(['--json', 'inspect', join(dir, 'missing.wav')]);
  assert.equal(missing.status, 3); assert.equal(JSON.parse(missing.stdout).exit_code, 3);
});

test('@claim:birdnet-selection copies only chosen clips and writes their time ranges', () => {
  const dir = temp();
  const queue = join(dir, 'queue'); const selected = join(dir, 'selected');
  slice(wav, queue);
  const result = run(['--json', 'select', join(queue, 'manifest.json'), '--output', selected, '--clips', '2']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).clips_selected, 1);
  assert.deepEqual(readdirSync(selected).sort(), ['clip_0002_00-00-10.wav', 'selection.csv']);
  assert.match(readFileSync(join(selected, 'selection.csv'), 'utf8'), /2,00:00:10\.000,00:00:20\.000/);
});

test('@claim:package-scope package is MIT licensed, has no model files, and has no network client dependency', () => {
  assert.match(readFileSync(join(root, 'LICENSE'), 'utf8'), /MIT License/);
  const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  assert.doesNotMatch(files, /\.(onnx|pt|pth|tflite|pb)$/m);
  const cargo = readFileSync(join(root, 'Cargo.toml'), 'utf8');
  assert.doesNotMatch(cargo, /reqwest|hyper|ureq|curl|telemetry|analytics|stripe|dodo|billing/i);
  assert.match(cargo, /rust-version = "1\.85"/);
  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.doesNotMatch(help.stdout, /^\s+identify\b/m);
});

test('@claim:build-artifacts production build creates the static site and single CLI binary', () => {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
  assert.ok(existsSync(join(root, 'dist/site/index.html')));
  assert.ok(existsSync(join(root, 'dist/site/demo/index.html')));
  assert.ok(existsSync(join(root, 'dist/site/404.html')));
  assert.deepEqual(readdirSync(join(root, 'dist/bin')), ['nightjar']);
});
