import { test, expect, type Page } from '@playwright/test';

async function as(page: Page, who: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  const form = page.locator('form', { hasText: who }).first();
  if (!(await form.isVisible())) await page.locator('details', { has: form }).locator('summary').click();
  await form.getByRole('button').click();
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

test('home: on a laptop screen the map explainer opens beside the branch, with no scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByText('Designed by Local Grow Pty Ltd')).toBeVisible();
  await page.getByRole('heading', { name: 'Explore the Entire Platform' }).scrollIntoViewIfNeeded();
  const judge = page.getByRole('button', { name: /^Judge/ }).first();
  await judge.click();
  await expect(page.locator('#map-explainer')).toContainText('scored blind');
  await expect(page.locator('#map-explainer')).toBeInViewport();
  await expect(judge).toBeInViewport();
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

test('home: job cards flip to explain, sector tiles open that sector', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Evaluate fairly/ }).first().click();
  await expect(page.locator('.flip[data-flipped]')).toHaveCount(1);
  await expect(page.getByText('A panel compares the scores and votes on the winners')).toBeVisible();
  // Tapping the card body again flips it back.
  await page.getByRole('button', { name: 'Flip Evaluate fairly back' }).click();
  await expect(page.locator('.flip[data-flipped]')).toHaveCount(0);
  await page.getByRole('link', { name: /Digital & technology/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Competitions open to Digital & technology' })).toBeVisible();
});

test('sign-in: roles are grouped into three dropdowns, one open at a time', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/login');
  const groups = page.locator('details[data-group]');
  await expect(groups).toHaveCount(3);
  await expect(page.getByRole('button', { name: /Evaluator/ })).toBeHidden();
  await page.locator('details[data-group="ceda"] summary').click();
  await expect(page.getByRole('button', { name: /Evaluator/ })).toBeVisible();
  await page.locator('details[data-group="innovators"] summary').click();
  await expect(page.locator('details[data-group="ceda"]')).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: /^Innovator/ }).click();
  await page.waitForURL('**/dashboard**');
});

test('home: SDG goals and inclusion charts show live figures', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Built Around the 2030 Goals' })).toBeVisible();
  await expect(page.getByText(/Women are \d+% of innovators; the goal is 50%/)).toBeVisible();
  await expect(page.getByRole('img', { name: /Innovators by gender: Women 28%/ })).toBeAttached();
  await expect(page.getByRole('img', { name: /Innovators by age: 18–24 28%/ })).toBeAttached();
});

test('instance as code: admin creates a draft from JSON, and the Studio code tab checks edits', async ({ page }) => {
  await as(page, 'CEDA administrator');
  await page.goto('/dashboard/instances/new');
  await page.getByRole('tab', { name: /From code/ }).click();
  const box = page.getByLabel('Competition as JSON');
  const sample = JSON.parse(await box.inputValue());
  sample.name = `Code-built Fund ${Date.now().toString(36)}`;
  sample.definition.rubric[0].weight += 5;
  await box.fill(JSON.stringify(sample, null, 2));
  await expect(page.getByText(/weights must add up to 100%/i)).toBeVisible();
  sample.definition.rubric[0].weight -= 5;
  await box.fill(JSON.stringify(sample, null, 2));
  await expect(page.getByText(/Valid: “Code-built Fund/)).toBeVisible();
  await page.getByRole('button', { name: 'Create draft from code' }).click();
  await page.waitForURL(/\/dashboard\/instances\/[0-9a-f-]{36}$/);
  await page.getByRole('tab', { name: 'Code (JSON)' }).click();
  const code = page.getByLabel('Competition as JSON');
  await expect(code).toHaveValue(new RegExp(sample.name));
  await code.fill('{ "name": "Broken" ');
  await expect(page.getByText(/This is not valid JSON/)).toBeVisible();
});

test('eligibility: each competition has its own rules, and the finder judges each one separately', async ({ page }) => {
  await page.goto('/eligibility');
  await expect(page.getByRole('heading', { name: 'Which competitions can I enter?' })).toBeVisible();
  const card = (slug: string) => page.locator(`[data-comp="${slug}"]`);
  await expect(card('ceda-women-enterprise-2026')).toContainText('At least 51% owned by women');
  await expect(card('youth-innovation-ideas-2026')).not.toContainText('owned by women');
  await page.getByRole('group', { name: 'Are you a citizen of Botswana?' }).getByText('Yes').click();
  await page.getByLabel('How old are you?').fill('24');
  await page.getByLabel('Where is your business today?').selectOption('idea');
  await expect(card('youth-innovation-ideas-2026')).toHaveAttribute('data-state', 'yes');
  await expect(card('ceda-women-enterprise-2026')).toHaveAttribute('data-state', 'no');
  await expect(page.getByText(/You can enter \d+ of \d+ open competitions/)).toBeVisible();

  await page.goto('/i/ceda-women-enterprise-2026');
  await expect(page.getByRole('heading', { name: 'Can I enter this competition?' })).toBeVisible();
  await expect(page.getByText('These rules are set for CEDA Women in Enterprise Fund 2026 only', { exact: false })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Do women own at least 51% of the business?' })).toBeVisible();
  await page.goto('/i/youth-innovation-ideas-2026');
  await expect(page.getByRole('group', { name: 'Do women own at least 51% of the business?' })).toHaveCount(0);
});
