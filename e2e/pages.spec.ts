import { test, expect, type Page } from '@playwright/test';

const PUBLIC = ['/', '/how-it-works', '/judges', '/instances', '/eligibility', '/help', '/status', '/privacy', '/community', '/funded', '/spaces/bdih', '/page/about', '/track', '/verify', '/login', '/register', '/forgot', '/demo-inbox'];

async function as(page: Page, who: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.locator('form', { hasText: who }).first().getByRole('button').click();
  await page.waitForURL('**/dashboard**');
}

async function healthy(page: Page, path: string) {
  const res = await page.goto(path);
  expect(res?.status(), path).toBeLessThan(400);
  await expect(page.locator('body'), path).not.toContainText(/Application error|Unhandled Runtime Error|Internal Server Error/);
}

test('every public page loads', async ({ page }) => {
  for (const p of PUBLIC) await healthy(page, p);
});

const ROLES: [string, string[]][] = [
  ['Innovator', ['/dashboard', '/dashboard/entries', '/dashboard/notifications', '/dashboard/profile']],
  ['Evaluator', ['/dashboard/review']],
  ['Adjudication panel', ['/dashboard/panel', '/dashboard/pipeline']],
  ['Committee observer', ['/dashboard/pipeline', '/dashboard/reports']],
  ['CEDA consultant', ['/dashboard/chat', '/dashboard/support']],
  ['CEDA administrator', ['/dashboard/screening', '/dashboard/pipeline', '/dashboard/reports', '/dashboard/instances', '/dashboard/instances/new', '/dashboard/content', '/dashboard/users', '/dashboard/audit', '/dashboard/privacy']],
  ['Partner admin (BDIH)', ['/dashboard/instances', '/dashboard/pipeline']],
  ['Super administrator', ['/dashboard/settings', '/dashboard/audit?tamper=1']],
];

for (const [role, pages] of ROLES) {
  test(`${role}: dashboard pages load`, async ({ page }) => {
    await as(page, role);
    for (const p of pages) await healthy(page, p);
  });
}

test('innovator detail pages open', async ({ page }) => {
  await as(page, 'Innovator');
  await page.goto('/dashboard/entries');
  const links = await page.locator('a[href^="/dashboard/entries/"]').evaluateAll((as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))]);
  expect(links.length).toBeGreaterThan(0);
  for (const l of links.slice(0, 6)) await healthy(page, l);
});

test('admin detail pages open', async ({ page }) => {
  await as(page, 'CEDA administrator');
  for (const list of ['/dashboard/screening', '/dashboard/pipeline', '/dashboard/instances']) {
    await page.goto(list);
    const links = await page.locator('main a[href^="/dashboard/"]').evaluateAll((as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))].filter((h) => /\/[0-9a-f-]{36}/.test(h)));
    for (const l of links.slice(0, 4)) await healthy(page, l);
  }
});
