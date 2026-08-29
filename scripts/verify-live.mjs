import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = (process.argv[2] || 'https://bird-audio-slicer.sociobot.in').replace(/\/$/, '');
const evidence = process.argv[3];
if (evidence) mkdirSync(evidence, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const routes = new Map([
  ['/', ['Nightjar Slicer — split long bird recordings', 200]],
  ['/demo/', ['Demo — Nightjar Slicer', 200]],
  ['/?demo=1', ['Demo — Nightjar Slicer', 200]],
  ['/privacy/', ['Privacy — Nightjar Slicer', 200]],
  ['/terms/', ['Terms — Nightjar Slicer', 200]],
  ['/definitely-missing-review-route', ['Page not found — Nightjar Slicer', 404]]
]);

for (const [route, [expectedTitle, expectedStatus]] of routes) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const consoleErrors = [];
  const requests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  if (route.includes('demo')) await page.getByText('2 clips from 00:00:20').waitFor();
  const title = await page.title();
  const h1 = await page.locator('h1').count();
  const main = await page.locator('main').count();
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const thirdParty = requests.filter((url) => new URL(url).origin !== new URL(base).origin);
  const unexpectedConsoleErrors = expectedStatus === 404
    ? consoleErrors.filter((message) => !message.includes('server responded with a status of 404'))
    : consoleErrors;
  if (response?.status() !== expectedStatus || title !== expectedTitle || h1 !== 1 || main !== 1 || !canonical || axe.violations.length || thirdParty.length || unexpectedConsoleErrors.length) {
    throw new Error(JSON.stringify({ route, status: response?.status(), title, h1, main, canonical, violations: axe.violations, thirdParty, consoleErrors: unexpectedConsoleErrors }, null, 2));
  }
  if (evidence && (route === '/' || route === '/demo/' || route.includes('missing'))) {
    const name = route === '/' ? 'home-mobile' : route === '/demo/' ? 'demo-mobile' : '404-mobile';
    await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
  }
  results.push({ route, status: response.status(), title, axeViolations: 0, thirdPartyRequests: 0, consoleErrors: 0 });
  await context.close();
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(`${base}/`);
const firstScreen = await mobile.locator('.proof-list').boundingBox();
const scrollWidth = await mobile.evaluate(() => document.documentElement.scrollWidth);
if (!firstScreen || firstScreen.y + firstScreen.height > 844 || scrollWidth > 390) throw new Error('mobile first screen or width failed');
await mobile.close();

const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offline = await offlineContext.newPage();
await offline.goto(`${base}/demo/`);
await offline.getByText('2 clips from 00:00:20').waitFor();
await offline.waitForFunction(() => navigator.serviceWorker?.controller !== null);
await offlineContext.setOffline(true);
await offline.reload();
await offline.getByText('2 clips from 00:00:20').waitFor();
results.push({ route: '/demo/ offline reload', status: 200, sampleClips: 2 });
await offlineContext.close();
await browser.close();

const report = { base, checkedAt: new Date().toISOString(), results };
if (evidence) writeFileSync(`${evidence}/browser-live.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
