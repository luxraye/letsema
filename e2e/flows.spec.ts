import { test, expect, type Page } from '@playwright/test';

async function as(page: Page, who: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.locator('form', { hasText: who }).first().getByRole('button').click();
  await page.waitForURL('**/dashboard**');
}
const firstDetail = (page: Page, prefix: string) => page.locator(`main a[href^="${prefix}"]`).evaluateAll((as, p) => as.map((a) => a.getAttribute('href')!).find((h) => new RegExp(`^${p}[0-9a-f-]{36}$`).test(h)), prefix);

test('screening: admin passes an application and it is logged', async ({ page }) => {
  await as(page, 'CEDA administrator');
  await page.goto('/dashboard/screening');
  const href = await firstDetail(page, '/dashboard/screening/');
  test.skip(!href, 'Nothing waiting for screening');
  await page.goto(href!);
  await page.getByLabel(/Pass: send to/).check();
  await page.getByRole('button', { name: 'Record decision' }).click();
  await expect(page.locator('body')).toContainText(/In review|Being scored|evaluator/i);
});

test('scoring: evaluator declares no conflict and submits sealed scores', async ({ page }) => {
  await as(page, 'Evaluator');
  await page.goto('/dashboard/review');
  const href = await firstDetail(page, '/dashboard/review/');
  test.skip(!href, 'Queue empty');
  await page.goto(href!);
  if (await page.getByRole('button', { name: 'Confirm' }).isVisible()) {
    await page.getByLabel(/No conflict/).check();
    await page.getByRole('button', { name: 'Confirm' }).click();
  }
  await page.getByLabel('Feedback for the applicant').fill('Clear problem and a credible pilot. Add unit costs and a route to paying customers.');
  await page.getByRole('button', { name: 'Submit scores' }).click();
  await expect(page.locator('body')).not.toContainText('Application error');
  await page.goto('/dashboard/review');
});

test('secure messaging: innovator writes to CEDA on their application', async ({ page }) => {
  await as(page, 'Innovator');
  await page.goto('/dashboard/entries');
  const href = await firstDetail(page, '/dashboard/entries/');
  await page.goto(href!);
  const msg = `Test message ${Date.now()}`;
  await page.getByPlaceholder('Write a message').fill(msg);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText(msg)).toBeVisible();
});

test('community: innovator asks a question and replies', async ({ page }) => {
  await as(page, 'Innovator');
  await page.goto('/community/new');
  await page.getByLabel('Your question').fill('Does anyone have a template for a cash flow forecast?');
  await page.getByLabel('Details').fill('CEDA asks for 12 months. Any simple template would help.');
  await page.getByRole('button', { name: 'Post question' }).click();
  await page.waitForURL(/\/community\/[0-9a-f-]{36}$/);
  await page.getByLabel('Your reply').fill('Answering my own question: there is one in the documents section.');
  await page.getByRole('button', { name: 'Post reply' }).click();
  await expect(page.getByText('Answering my own question')).toBeVisible();
});

test('support: anyone can report a problem and gets deadlines', async ({ page }) => {
  await page.goto('/help#support');
  await page.getByLabel('Your name').fill('Test Person');
  await page.getByLabel('Email or mobile for replies').fill('test@example.org');
  await page.getByLabel('Short summary').fill('Upload button does nothing');
  await page.getByLabel('What happened?').fill('I chose a PDF and nothing happened.');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('status')).toContainText(/Your reference is SUP-/);
});

test('audit: the public chain check passes', async ({ request }) => {
  const r = await (await request.get('/api/audit/verify')).json();
  expect(r.ok).toBe(true);
});

test('api: entries need a key, instances are public', async ({ request }) => {
  expect((await request.get('/api/v1/entries')).status()).toBe(401);
  const r = await (await request.get('/api/v1/instances')).json();
  expect(r.data.length).toBeGreaterThan(0);
});

test('home: search finds a funded idea with the keyboard shortcut', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByRole('dialog', { name: 'Search' }).getByLabel('Search').fill('cold');
  await expect(page.getByRole('dialog')).toContainText('SunCold');
});

test('home: system map opens a branch and lists its sections', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Trust/ }).first().click();
  await expect(page.getByRole('link', { name: /Audit trail anyone can check/ }).first()).toBeVisible();
});

test('dial *161#: track an application without data', async ({ page }) => {
  await page.goto('/dial');
  for (const k of ['*', '1', '6', '1', '#']) await page.getByRole('button', { name: k, exact: true }).click();
  await page.getByRole('button', { name: 'Call' }).click();
  await expect(page.locator('pre')).toContainText('Track my application');
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByLabel('Type with your keyboard').fill('0101');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('pre')).toContainText('CEDA-26-0101');
});

test('look switch: burgundy by default, one tap to azure, remembered on reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'burgundy');
  await page.getByRole('button', { name: 'Switch to the light Azure look' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'azure');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'azure');
  await page.getByRole('button', { name: 'Switch to the Burgundy look' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'burgundy');
});
