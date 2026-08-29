import './style.css';
import { clock, createPrivatePreviewManifest, parseWavHeader, planFixed } from './wav.mjs';

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
const routeStatus = document.querySelector<HTMLElement>('#route-status')!;
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

function showPlan(name: string, fileBytes: number, audio: ReturnType<typeof parseWavHeader>, chunkSeconds: number) {
  const ranges = planFixed(audio.duration, chunkSeconds);
  rows.replaceChildren(...ranges.slice(0, 8).map((range) => {
    const row = document.createElement('tr');
    row.innerHTML = `<th scope="row">${String(range.index).padStart(4, '0')}</th><td>${clock(range.start)}</td><td>${clock(range.end)}</td><td><span class="ready-dot" aria-hidden="true"></span>Planned</td>`;
    return row;
  }));
  resultTitle.textContent = `${ranges.length.toLocaleString()} clips from ${clock(audio.duration)}`;
  facts.replaceChildren(
    fact('Recording', name),
    fact('Format', `${audio.container} · ${audio.bitsPerSample}-bit`),
    fact('Audio', `${audio.sampleRate.toLocaleString()} Hz · ${audio.channels} channel`),
    fact('Size', formatBytes(fileBytes))
  );
  remaining.textContent = ranges.length > 8
    ? `Showing 8 of ${ranges.length.toLocaleString()} planned clips.`
    : `Showing all ${ranges.length.toLocaleString()} planned clips.`;
  currentManifest = createPrivatePreviewManifest({ fileName: name, fileBytes, audio, chunkSeconds, ranges });
  setState('result');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorText.textContent = '';
  const file = fileInput.files?.[0];
  const chunkSeconds = Number(lengthInput.value);
  if (!file) {
    errorText.textContent = 'Choose a complete PCM or float WAV recording, then try again.';
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
    showPlan(file.name, file.size, parseWavHeader(header, file.size), chunkSeconds);
  } catch (error) {
    errorText.textContent = error instanceof Error ? error.message : 'Nightjar could not read this WAV. Export it as PCM WAV and try again.';
    setState('empty');
  }
});

fileInput.addEventListener('change', () => { errorText.textContent = ''; });

download.addEventListener('click', () => {
  if (!currentManifest) return;
  const blob = new Blob([`${JSON.stringify(currentManifest, null, 2)}\n`], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'nightjar-clip-plan.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
});

const copyButton = document.querySelector<HTMLButtonElement>('#copy-command')!;
const copyStatus = document.querySelector<HTMLElement>('#copy-status')!;
copyButton.addEventListener('click', async () => {
  const command = document.querySelector<HTMLElement>('#install-command')!.textContent?.split('\n')[0] ?? '';
  try {
    await navigator.clipboard.writeText(command);
    copyStatus.textContent = 'The install command is on your clipboard.';
  } catch {
    copyStatus.textContent = 'Clipboard access was blocked. Select the install command and copy it.';
  }
});

const offlineBanner = document.querySelector<HTMLElement>('#offline-banner')!;
function updateConnection() { offlineBanner.hidden = navigator.onLine; }
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function routeHeading() {
  if (!location.hash) return document.querySelector<HTMLElement>('#hero-title');
  const target = document.querySelector<HTMLElement>(location.hash);
  return target?.matches('h1,h2') ? target : target?.querySelector<HTMLElement>('h1,h2');
}

function restoreRoutePosition() {
  const heading = routeHeading();
  if (!heading) return;
  document.documentElement.classList.add('route-restoring');
  heading.focus({ preventScroll: true });
  if (location.hash) heading.scrollIntoView({ block: 'start', behavior: 'auto' });
  else window.scrollTo({ top: 0, behavior: 'auto' });
  routeStatus.textContent = heading.textContent ?? document.title;
  requestAnimationFrame(() => document.documentElement.classList.remove('route-restoring'));
}

function scheduleRouteRestore() {
  requestAnimationFrame(() => setTimeout(restoreRoutePosition, 0));
}
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"],a[href^="/#"]');
  if (!link) return;
  const target = new URL(link.href);
  if (target.pathname !== location.pathname || target.search !== location.search) return;
  event.preventDefault();
  history.pushState(null, '', `${target.pathname}${target.search}${target.hash}`);
  scheduleRouteRestore();
});
window.addEventListener('hashchange', scheduleRouteRestore);
window.addEventListener('popstate', scheduleRouteRestore);
window.addEventListener('pageshow', () => {
  if (location.hash) scheduleRouteRestore();
});

const isDemo = location.pathname.replace(/\/+$/, '') === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
async function loadDemo() {
  setState('loading');
  errorText.textContent = '';
  try {
    const response = await fetch('/examples/nightjar-demo.wav');
    if (!response.ok) throw new Error('The bundled sample could not be loaded. Reload the page and try again.');
    const buffer = await response.arrayBuffer();
    showPlan('Dawn Marsh sample', buffer.byteLength, parseWavHeader(buffer.slice(0, 256 * 1024), buffer.byteLength), 10);
    routeStatus.textContent = 'Demo clip plan ready';
  } catch (error) {
    errorText.textContent = error instanceof Error ? error.message : 'The bundled sample could not be loaded. Reload the page and try again.';
    setState('empty');
  }
}

if (isDemo) {
  document.body.classList.add('demo-mode');
  document.querySelector<HTMLElement>('#demo-banner')!.hidden = false;
  document.querySelector<HTMLElement>('#hero-title')!.textContent = 'Explore a 20-second bird recording';
  document.querySelector<HTMLElement>('.hero .lede')!.textContent = 'This isolated sample shows two planned WAV clips. Reset it any time or start with your recording.';
  document.title = 'Demo — Nightjar Slicer';
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = 'https://bird-audio-slicer.sociobot.in/demo/';
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')!.content = 'https://bird-audio-slicer.sociobot.in/demo/';
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = 'Demo — Nightjar Slicer';
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = 'Demo — Nightjar Slicer';
  document.querySelector<HTMLButtonElement>('#reset-demo')!.addEventListener('click', loadDemo);
  document.querySelector<HTMLElement>('#hero-title')!.focus({ preventScroll: true });
  void loadDemo();
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
