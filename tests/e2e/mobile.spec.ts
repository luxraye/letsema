import { expect, test } from '@playwright/test';

test('home, calls and tracker work at phone width without sideways scrolling', async ({ page }) => {
  for (const path of ['/', '/calls', '/track/LTS-26-0101', '/help']) {
    await page.goto(`/#${path}`);
    await expect(page.locator('h1').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
