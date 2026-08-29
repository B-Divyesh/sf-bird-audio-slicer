import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function wavPayload(seconds = 25, sampleRate = 8000) {
  const dataBytes = seconds * sampleRate * 2;
  const bytes = Buffer.alloc(44 + dataBytes);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(dataBytes + 36, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28); bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(dataBytes, 40);
  return bytes;
}

test('@claim:browser-demo-one-click demo loads sample, resets, and exits without persistence', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Nightjar Slicer');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('2 clips from 00:00:20')).toBeVisible();
  await expect(page.getByText('Dawn Marsh sample')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('2 clips from 00:00:20')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start for real' })).toHaveAttribute('href', '/#planner');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('2 clips from 00:00:20')).toBeVisible();
});

test('@claim:browser-private planner reads no more than 256 KiB and keeps data local', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    const original = Blob.prototype.slice;
    window.__nightjarLargestSlice = 0;
    Blob.prototype.slice = function(start, end, type) {
      window.__nightjarLargestSlice = Math.max(window.__nightjarLargestSlice, (end ?? this.size) - (start ?? 0));
      return original.call(this, start, end, type);
    };
  });
  await page.goto('/');
  await page.locator('#recording').setInputFiles({ name: 'SecretMarsh_51.501N_-0.142W.wav', mimeType: 'audio/wav', buffer: wavPayload() });
  await page.locator('#chunk-seconds').fill('10');
  await page.getByRole('button', { name: 'Plan WAV clips' }).click();
  await expect(page.getByText('3 clips from 00:00:25')).toBeVisible();
  expect(await page.evaluate(() => window.__nightjarLargestSlice)).toBeLessThanOrEqual(256 * 1024);
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  const stores = await page.evaluate(async () => ({
    cookies: document.cookie,
    local: localStorage.length,
    session: sessionStorage.length,
    indexed: (await indexedDB.databases()).length
  }));
  expect(stores).toEqual({ cookies: '', local: 0, session: 0, indexed: 0 });
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download clip plan' }).click();
  const stream = await (await downloadEvent).createReadStream();
  let text = '';
  for await (const part of stream) text += part;
  expect(text).not.toContain('SecretMarsh_51.501N_-0.142W.wav');
  expect(JSON.parse(text).source).toMatchObject({ name: null, path: null });
});

test('@claim:offline-demo demo reloads offline after one visit', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/demo/');
  await expect(page.getByText('2 clips from 00:00:20')).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('2 clips from 00:00:20')).toBeVisible();
  await expect(page.locator('#offline-banner')).toBeVisible();
  await page.goto('/?demo=1');
  await expect(page.getByText('2 clips from 00:00:20')).toBeVisible();
  await expect(page.locator('#offline-banner')).toBeVisible();
  await context.setOffline(false);
  const cleared = await page.evaluate(async () => {
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    for (const key of await caches.keys()) await caches.delete(key);
    return { registrations: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).length };
  });
  expect(cleared).toEqual({ registrations: 0, caches: 0 });
  await context.close();
});

test('@claim:site-structure routes have metadata, focus, accessibility, and a product 404', async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  const titles = new Map([
    ['/', 'Nightjar Slicer — split long bird recordings'],
    ['/demo/', 'Demo — Nightjar Slicer'],
    ['/privacy/', 'Privacy — Nightjar Slicer'],
    ['/terms/', 'Terms — Nightjar Slicer'],
    ['/404.html', 'Page not found — Nightjar Slicer']
  ]);
  for (const [route, title] of titles) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations, route).toEqual([]);
  }
  await page.goto('/privacy/');
  await expect(page.locator('h1')).toBeFocused();
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Nightjar Slicer');
  await expect(page.getByRole('link', { name: 'Return to Nightjar Slicer' })).toBeVisible();
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
  await page.goto('/');
  await page.getByRole('link', { name: 'Install the CLI' }).click();
  await expect(page.locator('#install-title')).toBeFocused();
  await page.goBack();
  await expect(page.locator('#hero-title')).toBeFocused();
});

test('mobile first screen is complete and layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Split long bird recordings into WAV clips' })).toBeVisible();
  await expect(page.getByText('For AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Try it with sample data/ })).toBeVisible();
  await expect(page.getByText('Loads a 20-second field recording and shows its clip plan.')).toBeVisible();
  const facts = page.locator('.proof-list');
  await expect(facts).toBeVisible();
  expect((await facts.boundingBox()).y + (await facts.boundingBox()).height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('.hero-copy').evaluate((element) => parseFloat(getComputedStyle(element).animationDuration) || 0)).toBeLessThanOrEqual(0.001);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
});
