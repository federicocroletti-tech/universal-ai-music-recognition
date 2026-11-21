import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('recognizes a melody hummed into the microphone', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/');
  await expect(page.getByRole('log')).toContainText('canticchia una melodia');

  await page.getByRole('button', { name: 'Registra e canticchia' }).click();
  await expect(page.getByRole('status')).toContainText('Ti ascolto');
  // The fake microphone plays about 6 seconds of humming.
  await page.waitForTimeout(6500);
  await page.getByRole('button', { name: 'Ferma la registrazione' }).click();

  const result = page.locator('app-result-card');
  await expect(result.getByRole('heading', { level: 2 })).toHaveText('Inno alla gioia (Sinfonia n. 9)', { timeout: 15_000 });
  await expect(result).toContainText('Riconosciuta');
  // Also catches Content Security Policy violations, which are reported as console errors.
  expect(errors).toEqual([]);
});

test('serves prerendered, indexable pages with security headers', async ({ request }) => {
  const home = await request.get('/');
  expect(home.ok()).toBe(true);
  expect(await home.text()).toContain('Riconosci una melodia canticchiando');
  expect(home.headers()['content-security-policy']).toContain("script-src 'self'");
  expect(home.headers()['permissions-policy']).toContain('microphone=(self)');

  const privacy = await request.get('/privacy');
  expect(privacy.ok()).toBe(true);
  const privacyHtml = await privacy.text();
  expect(privacyHtml).toContain('Informativa privacy');
  expect(privacyHtml).toContain('<link rel="canonical" href="https://hum-finder-croletti.vercel.app/privacy">');

  for (const path of ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/og-image.png']) {
    expect((await request.get(path)).ok(), path).toBe(true);
  }
});

for (const path of ['/', '/privacy']) {
  test(`has no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.locator('h1').first().waitFor({ state: 'attached' });
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`)).toEqual([]);
  });
}
