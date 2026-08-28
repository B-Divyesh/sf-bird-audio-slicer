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

test('desktop planner is keyboard-operable and downloads a filename-redacted manifest', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();

  await page.locator('#recording').setInputFiles({
    name: 'SecretMarsh_51.501N_-0.142W.wav',
    mimeType: 'audio/wav',
    buffer: wavPayload()
  });
  await page.locator('#chunk-seconds').fill('10');
  await page.getByRole('button', { name: 'Plan fixed clips' }).press('Enter');
  await expect(page.locator('#result-state')).toBeVisible();
  await expect(page.getByText('3 clips from 00:00:25')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample manifest' }).click();
  const manifest = await (await download).createReadStream();
  let text = '';
  for await (const part of manifest) text += part;
  expect(text).not.toContain('SecretMarsh_51.501N_-0.142W.wav');
  expect(JSON.parse(text).source).toMatchObject({ name: null, path: null });
});

test('mobile layout is accessible, honors reduced motion, and serves the shell offline', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#planner-form')).toBeVisible();
  expect(await page.locator('.hero-scene').evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))).toBeLessThanOrEqual(0.001);

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);

  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  const online = await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
    return navigator.onLine;
  });
  expect(online).toBe(false);
  await expect(page.locator('#offline-banner')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});
