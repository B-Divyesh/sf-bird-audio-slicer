import './style.css';
import { clock, parseWavHeader, planFixed } from './wav.mjs';

const form = document.querySelector<HTMLFormElement>('#planner-form')!;
const fileInput = document.querySelector<HTMLInputElement>('#recording')!;
const lengthInput = document.querySelector<HTMLInputElement>('#chunk-seconds')!;
const errorText = document.querySelector<HTMLElement>('#file-error')!;
const output = document.querySelector<HTMLElement>('#planner-output')!;
const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
const loadingState = document.querySelector<HTMLElement>('#loading-state')!;
const resultState = document.querySelector<HTMLElement>('#result-state')!;
const rows = document.querySelector<HTMLTableSectionElement>('#clip-rows')!;
const facts = document.querySelector<HTMLElement>('#recording-facts')!;
const resultTitle = document.querySelector<HTMLElement>('#result-title')!;
const remaining = document.querySelector<HTMLElement>('#remaining-clips')!;
const download = document.querySelector<HTMLButtonElement>('#download-manifest')!;
let currentManifest: Record<string, unknown> | null = null;

function setState(state: 'empty' | 'loading' | 'result') {
  emptyState.hidden = state !== 'empty';
  loadingState.hidden = state !== 'loading';
  resultState.hidden = state !== 'result';
  output.className = `planner-output ${state}`;
  output.setAttribute('aria-busy', String(state === 'loading'));
}

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) { value /= 1000; unit += 1; }
  return `${value.toFixed(unit > 1 ? 2 : 0)} ${units[unit]}`;
}

function fact(term: string, description: string) {
  const group = document.createElement('div');
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = term;
  dd.textContent = description;
  group.append(dt, dd);
  return group;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorText.textContent = '';
  const file = fileInput.files?.[0];
  const chunkSeconds = Number(lengthInput.value);
  if (!file) {
    errorText.textContent = 'Choose a WAV recording before planning clips.';
    fileInput.focus();
    setState('empty');
    return;
  }
  if (!Number.isFinite(chunkSeconds) || chunkSeconds < 10 || chunkSeconds > 3600) {
    errorText.textContent = 'Enter a clip length from 10 to 3,600 seconds.';
    lengthInput.focus();
    return;
  }

  setState('loading');
  try {
    const header = await file.slice(0, 256 * 1024).arrayBuffer();
    const audio = parseWavHeader(header, file.size);
    const ranges = planFixed(audio.duration, chunkSeconds);
    rows.replaceChildren(...ranges.slice(0, 8).map((range) => {
      const row = document.createElement('tr');
      row.innerHTML = `<th scope="row">${String(range.index).padStart(4, '0')}</th><td>${clock(range.start)}</td><td>${clock(range.end)}</td><td><span class="ready-dot" aria-hidden="true"></span>Planned</td>`;
      return row;
    }));
    resultTitle.textContent = `${ranges.length.toLocaleString()} clips from ${clock(audio.duration)}`;
    facts.replaceChildren(
      fact('Recording', file.name),
      fact('Format', `${audio.container} · ${audio.bitsPerSample}-bit`),
      fact('Audio', `${audio.sampleRate.toLocaleString()} Hz · ${audio.channels} ch`),
      fact('Size', formatBytes(file.size))
    );
    remaining.textContent = ranges.length > 8 ? `Showing 8 of ${ranges.length.toLocaleString()} planned clips.` : `Showing all ${ranges.length.toLocaleString()} planned clips.`;
    currentManifest = {
      schema: 'nightjar-manifest/v1-preview',
      privacy: { source_path_included: false, note: 'Generated locally; source path and recording metadata omitted.' },
      source: { name: file.name, file_bytes: file.size, sample_rate_hz: audio.sampleRate, channels: audio.channels, duration_seconds: audio.duration },
      settings: { mode: 'fixed', chunk_seconds: chunkSeconds },
      chunks: ranges.map((range) => ({ index: range.index, start_seconds: range.start, end_seconds: range.end, start_timestamp: clock(range.start), end_timestamp: clock(range.end), status: 'planned' }))
    };
    setState('result');
  } catch (error) {
    errorText.textContent = error instanceof Error ? error.message : 'Nightjar could not read this WAV header.';
    setState('empty');
  }
});

fileInput.addEventListener('change', () => { errorText.textContent = ''; });

download.addEventListener('click', () => {
  if (!currentManifest) return;
  const blob = new Blob([`${JSON.stringify(currentManifest, null, 2)}\n`], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'nightjar-plan.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
});

const copyButton = document.querySelector<HTMLButtonElement>('#copy-command')!;
const copyStatus = document.querySelector<HTMLElement>('#copy-status')!;
copyButton.addEventListener('click', async () => {
  const command = document.querySelector<HTMLElement>('#install-command')!.textContent ?? '';
  try {
    await navigator.clipboard.writeText(command);
    copyButton.textContent = 'Copied';
    copyStatus.textContent = 'Installation command copied to the clipboard.';
  } catch {
    copyStatus.textContent = 'Clipboard access was blocked. Select the command text to copy it.';
  }
});

const offlineBanner = document.querySelector<HTMLElement>('#offline-banner')!;
function updateConnection() { offlineBanner.hidden = navigator.onLine; }
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
