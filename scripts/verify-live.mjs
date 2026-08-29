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
  if (expectedStatus === 404 && await page.locator('h1').textContent() !== 'Page not found') {
    throw new Error('The live 404 heading is not literal.');
  }
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

const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const demo = await demoContext.newPage();
await demo.goto(`${base}/`);
await demo.evaluate(() => localStorage.setItem('real:sentinel', 'keep-me'));
await demo.goto(`${base}/demo/`);
await demo.getByText('2 clips from 00:00:20').waitFor();
const demoGeometry = await demo.evaluate(() => {
  const output = document.querySelector('#planner-output').getBoundingClientRect();
  const table = document.querySelector('.table-wrap');
  return {
    outputLeft: output.left,
    outputRight: output.right,
    tableClientWidth: table.clientWidth,
    tableScrollWidth: table.scrollWidth,
    tableOverflow: getComputedStyle(table).overflowX
  };
});
if (demoGeometry.outputLeft < 0 || demoGeometry.outputRight > 390 || demoGeometry.tableScrollWidth <= demoGeometry.tableClientWidth || demoGeometry.tableOverflow !== 'auto') {
  throw new Error(`live mobile demo overflow failed: ${JSON.stringify(demoGeometry)}`);
}
await demo.evaluate(() => scrollTo(0, 1200));
await demo.waitForTimeout(100);
const bannerTop = await demo.locator('#demo-banner').evaluate((element) => Math.round(element.getBoundingClientRect().top));
if (bannerTop !== 0) throw new Error(`live demo banner is not sticky: top=${bannerTop}`);
await demo.getByRole('button', { name: 'Download clip plan' }).scrollIntoViewIfNeeded();
if (!await demo.getByRole('button', { name: 'Download clip plan' }).isVisible()) throw new Error('live demo download is unreachable');
await demo.getByRole('button', { name: 'Reset demo' }).click();
await demo.getByText('2 clips from 00:00:20').waitFor();
if (await demo.evaluate(() => localStorage.getItem('real:sentinel')) !== 'keep-me') throw new Error('demo changed real storage');
await demo.getByRole('link', { name: 'Start for real' }).click();
await demo.getByText('No recording selected').waitFor();
if (await demo.locator('#demo-banner').isVisible()) throw new Error('demo banner remained after exit');
results.push({ route: '/demo/ mobile', outputWithinViewport: true, tableScrollport: true, stickyBanner: true, resetAndExit: true, realStoragePreserved: true });
await demoContext.close();

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  const bodyText = await page.locator('body').innerText();
  for (const removed of ['prebuilt binaries', 'redacted manifest', 'This recording path ends here']) {
    if (bodyText.includes(removed)) throw new Error(`removed copy remains live: ${removed}`);
  }
  await page.getByRole('link', { name: 'Install the CLI' }).click();
  await page.locator('#install-title').waitFor();
  await page.goBack();
  await page.waitForFunction(() => document.activeElement?.id === 'hero-title' && scrollY === 0);
  const hero = await page.locator('#hero-title').boundingBox();
  if (!hero || hero.y < -1 || hero.y + hero.height > viewport.height) throw new Error(`Back heading is outside ${viewport.width}px viewport`);
  await page.goForward();
  await page.waitForFunction(() => document.activeElement?.id === 'install-title');
  const install = await page.locator('#install-title').boundingBox();
  if (!install || install.y < -1 || install.y + install.height > viewport.height) throw new Error(`Forward heading is outside ${viewport.width}px viewport`);
  results.push({ route: `history ${viewport.width}px`, backFocusVisible: true, forwardFocusVisible: true });
  await context.close();
}

const copyContext = await browser.newContext({ serviceWorkers: 'block' });
const copyPage = await copyContext.newPage();
await copyPage.goto(`${base}/`);
await copyPage.getByRole('button', { name: 'Copy install command' }).click();
if (await copyPage.locator('#copy-command').textContent() !== 'Copy install command') throw new Error('copy button lost its action label');
results.push({ route: '/#install copy action', actionLabelPreserved: true });
await copyContext.close();

const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offline = await offlineContext.newPage();
await offline.goto(`${base}/demo/`);
await offline.getByText('2 clips from 00:00:20').waitFor();
await offline.waitForFunction(() => navigator.serviceWorker?.controller !== null);
await offlineContext.setOffline(true);
await offline.reload();
await offline.getByText('2 clips from 00:00:20').waitFor();
await offline.goto(`${base}/?demo=1`);
await offline.getByText('2 clips from 00:00:20').waitFor();
results.push({ route: '/demo/ and /?demo=1 offline', status: 200, sampleClips: 2 });
await offlineContext.close();
await browser.close();

const report = { base, checkedAt: new Date().toISOString(), results };
if (evidence) writeFileSync(`${evidence}/browser-live.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
