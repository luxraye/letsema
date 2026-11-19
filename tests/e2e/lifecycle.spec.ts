import { expect, test, type Page } from '@playwright/test';

// Sign in as a demo account in this tab only (each tab is its own session).
async function as(page: Page, userId: string, path: string) {
  await page.addInitScript((u) => sessionStorage.setItem('letsema:session', u), userId);
  await page.goto(`/#${path}`);
}

test('register with OTP verification, then sign in', async ({ page, context }) => {
  await page.goto('/#/register');
  await page.getByLabel('Full name').fill('Tlotlo Test');
  await page.getByLabel('Email').fill('tlotlo@example.bw');
  await page.getByLabel(/^Password/).fill('weak');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert')).toContainText('10 characters');
  await page.getByLabel(/^Password/).fill('Strong-pass-2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Verify your account' })).toBeVisible();
  const inbox = await context.newPage();
  await inbox.goto('/#/inbox');
  const body = await inbox.getByText(/Your one-time code is/).first().textContent();
  const code = body!.match(/\d{6}/)![0];
  await page.getByLabel('Code').fill(code);
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(/#\/app/);
  await expect(page.getByRole('heading', { name: /Tlotlo/ })).toBeVisible();
});

test('wrong password is refused and audited', async ({ page }) => {
  await page.goto('/#/login');
  await page.getByLabel('Email or mobile number').fill('innovator@letsema.demo');
  await page.getByLabel('Password').fill('nope-nope-1');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await page.getByLabel('Password').fill('Letsema2026!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Kagiso/ })).toBeVisible();
});

test('submission form enforces required fields and issues a receipt', async ({ page }) => {
  await as(page, 'u_innovator', '/app/ideas/new?call=c_agri');
  await page.getByLabel('Idea title').fill('Solar milk chillers for village dairies');
  await page.getByLabel('One-paragraph summary').fill('Shared solar milk chillers so small dairy farmers can sell evening milk instead of pouring it away.');
  await page.getByRole('button', { name: /Step 4/ }).click();
  await expect(page.getByText(/Still needed/)).toBeVisible();
  await page.getByRole('button', { name: 'Submit idea' }).click();
  await expect(page.getByText(/still missing/)).toBeVisible();
  await page.getByRole('button', { name: /Step 2/ }).click();
  await page.getByLabel(/What problem are you solving/).fill('Evening milk spoils because villages have no cooling.');
  await page.getByLabel(/What is your solution/).fill('Solar chillers shared by 10–20 farmers, paid per litre.');
  await page.getByLabel(/Who will pay/).fill('Farmers pay per litre chilled; the dairy buyer collects daily.');
  await page.getByLabel(/How far along/).selectOption('Prototype');
  await page.getByLabel(/Jobs you expect/).fill('6');
  await page.getByLabel(/Funding requested/).fill('90000');
  await page.getByLabel(/Yes, this is true|More than 50%/).first().check();
  await page.getByRole('button', { name: /Step 3/ }).click();
  const sample = page.getByRole('button', { name: 'Use sample file' });
  while (await sample.count()) await sample.first().click();
  await page.getByRole('button', { name: /Step 4/ }).click();
  await expect(page.getByText('Everything required is complete.')).toBeVisible();
  await page.getByRole('button', { name: 'Submit idea' }).click();
  await expect(page.getByRole('dialog', { name: /receipt/ })).toContainText('LTS-26-');
});

test('full multi-level evaluation: screen → blind review → committee → award', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  // Level 1: admin screens a submitted idea
  await as(page, 'u_admin', '/app/ideas/i_102');
  await page.getByRole('button', { name: 'Pass and assign reviewers' }).click();
  await expect(page.getByText('In review').first()).toBeVisible();
  const reviewers = await page.locator('text=Level 2: reviewers').locator('..').locator('li').allTextContents();
  expect(reviewers.length).toBeGreaterThanOrEqual(2);
  // Level 2: each assigned reviewer declares no conflict and scores blind
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('letsema:state:v3')!).ideas.find((i: { id: string }) => i.id === 'i_102').assignments.map((a: { reviewerId: string }) => a.reviewerId));
  for (const rid of ids) {
    const p = await ctx.newPage();
    await as(p, rid, '/app/review/i_102');
    await p.getByRole('button', { name: 'I have no conflict of interest' }).click();
    await expect(p.getByText('Blind review')).toBeVisible();
    await expect(p.getByText('Boitumelo')).toHaveCount(0); // submitter name never shown
    for (const group of await p.getByRole('radiogroup').all()) await group.getByRole('radio', { name: '4' }).click();
    for (const t of await p.getByPlaceholder('Why this score?').all()) await t.fill('Clear and well evidenced.');
    await p.getByLabel('Overall comment').fill('Strong proposal with a clear market.');
    await p.getByRole('button', { name: 'Submit review' }).click();
    await expect(p).toHaveURL(/#\/app\/review$/);
    await p.close();
  }
  // Level 3: committee chair votes, others vote, chair decides
  const chair = await ctx.newPage();
  await as(chair, 'u_committee', '/app/ideas/i_102');
  await expect(chair.getByText('Level 3: committee')).toBeVisible();
  await chair.getByRole('button', { name: 'approve', exact: true }).click();
  await chair.getByRole('button', { name: 'Demo: other members vote' }).click();
  await chair.getByLabel('Decision reason (shared with innovator)').fill('Excellent calibrated score and a credible delivery plan.');
  await chair.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(chair.getByText('Confirm award', { exact: true })).toBeVisible();
  await chair.getByRole('button', { name: 'Confirm award & milestone plan' }).click();
  await expect(chair.getByText('Award certificate')).toBeVisible();
  // Audit chain still verifies after all of that
  const admin = await ctx.newPage();
  await as(admin, 'u_admin', '/app/audit');
  await admin.getByRole('button', { name: 'Verify now' }).click();
  await expect(admin.getByText(/Intact/)).toBeVisible();
  await admin.getByRole('button', { name: 'Run tamper test' }).click();
  await expect(admin.getByText(/detected at #/)).toBeVisible();
  await ctx.close();
});

test('feedback loop: innovator replies and resubmits; reviewer sees what changed', async ({ browser }) => {
  const ctx = await browser.newContext();
  const inn = await ctx.newPage();
  await as(inn, 'u_innovator', '/app/ideas/i_101/edit');
  await inn.getByRole('button', { name: /Step 2/ }).click();
  await inn.getByLabel(/What is your solution/).fill('Cheap solar soil-moisture tags that send a Setswana SMS with irrigation advice. Survey of 14 farmers attached; unit cost P180.');
  await inn.waitForTimeout(1500);
  await inn.goto('/#/app/ideas/i_101');
  await inn.getByLabel('What did you change?').fill('Added farmer survey and unit cost.');
  await inn.getByRole('button', { name: 'Resubmit' }).click();
  await expect(inn.getByText('In review').first()).toBeVisible();
  await inn.getByRole('tab', { name: /Versions/ }).click();
  await expect(inn.locator('.bg-emerald-200\\/70').first()).toBeVisible();
  await ctx.close();
});

test('real-time: a status change in one tab notifies another tab live', async ({ browser }) => {
  const ctx = await browser.newContext();
  const inn = await ctx.newPage();
  await as(inn, 'u_innovator', '/app');
  const admin = await ctx.newPage();
  await as(admin, 'u_admin', '/app/ideas/i_103');
  await admin.getByRole('button', { name: 'Pass and assign reviewers' }).click();
  await expect(inn.getByText(/Live update from another session/)).toBeVisible({ timeout: 5000 });
  await ctx.close();
});

test('RBAC: reviewer cannot open admin pages or un-blinded idea pages', async ({ page }) => {
  await as(page, 'u_reviewer', '/app/admin/users');
  await expect(page.getByRole('link', { name: 'Users & roles' })).toHaveCount(0);
  await page.goto('/#/app/ideas/i_120');
  await expect(page.getByText(/do not have access|Open this idea from your review queue/)).toBeVisible();
});

test('live chat: visitor message reaches consultant console', async ({ browser }) => {
  const ctx = await browser.newContext();
  const visitor = await ctx.newPage();
  await visitor.goto('/#/help');
  await visitor.getByRole('button', { name: /Open live chat/ }).click();
  const sim = visitor.getByRole('button', { name: 'Demo: simulate working hours' });
  if (await sim.isVisible()) await sim.click();
  await visitor.getByLabel('Your name').fill('Neo Visitor');
  await visitor.getByLabel('Message').fill('Can I apply as a sole trader?');
  await visitor.getByRole('button', { name: 'Start chat' }).click();
  const agent = await ctx.newPage();
  await as(agent, 'u_consultant', '/app/chat');
  await agent.getByText('Neo Visitor').first().click();
  await agent.getByLabel('Reply to Neo Visitor').fill('Yes, if the business is registered with CIPA.');
  await agent.getByLabel('Reply to Neo Visitor').press('Enter');
  await expect(visitor.getByText('Yes, if the business is registered with CIPA.')).toBeVisible();
  await ctx.close();
});
