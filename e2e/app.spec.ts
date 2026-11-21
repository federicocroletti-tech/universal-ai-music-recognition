import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('recognizes a melody hummed into the microphone', async ({ page }) => {
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
});

test('serves prerendered, indexable pages', async ({ request }) => {
  const home = await request.get('/');
  expect(home.ok()).toBe(true);
  expect(await home.text()).toContain('Riconosci una melodia canticchiando');

  const privacy = await request.get('/privacy');
  expect(privacy.ok()).toBe(true);
  expect(await privacy.text()).toContain('Informativa privacy');
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
