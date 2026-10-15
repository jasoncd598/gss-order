import { test, expect, type Page } from '@playwright/test';

// Demo mode: signed in as a company Admin who is also GSS staff, on sample data.
// Actions return success without writing anything.

/** Opens the side nav on phones, where it sits behind the menu button. */
async function openNav(page: Page) {
  const menu = page.getByRole('button', { name: 'Open navigation' });
  if (await menu.isVisible().catch(() => false)) await menu.click();
}

test.describe('public site', () => {
  test('landing page shows the plans', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.getByRole('button', { name: /start .*trial|start free trial|choose/i }).first()).toBeVisible();
  });

  test('sign-in page has the form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com.au')).toBeVisible();
    await expect(page.getByPlaceholder('Your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in securely/i })).toBeVisible();
  });

  test('responses carry security headers', async ({ request }) => {
    const res = await request.get('/welcome');
    expect(res.headers()['x-frame-options']).toBe('DENY');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  });
});

test.describe('customer', () => {
  test('reorder: add a plate from the catalogue and place the order', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: 'Reorder Catalog' })).toBeVisible();

    await page.getByRole('button', { name: 'Add to Cart' }).first().click();
    await expect(page.getByText('Added!').first()).toBeVisible();

    await page.goto('/cart');
    await page.getByRole('button', { name: 'Review Order' }).click();
    await page.getByRole('button', { name: /^Place Order/ }).click();

    await expect(page.getByRole('heading', { name: 'Order Submitted!' })).toBeVisible();
    await expect(page.getByText(/ORD-/).first()).toBeVisible();
  });

  test('pay: an unpaid order offers card payment and has a tax invoice', async ({ page }) => {
    await page.goto('/order/ord-8740');
    await expect(page.getByText('ORD-2026-8740').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pay by Card' })).toBeVisible();

    await page.goto('/invoice/ord-8740');
    await expect(page.getByText(/tax invoice/i).first()).toBeVisible();
    await expect(page.getByText(/GST/).first()).toBeVisible();
  });

  test('approve: a proof awaiting review can be approved', async ({ page }) => {
    await page.goto('/vault');
    await page.getByRole('button', { name: 'Review', exact: true }).first().click();
    await page.getByRole('button', { name: 'Approve Proof' }).click();
    // The modal closes and the card no longer asks for a review
    await expect(page.getByRole('button', { name: 'Approve Proof' })).toHaveCount(0);
  });

  test('order documents: listed on the order, staff can add one', async ({ page }) => {
    await page.goto('/order/ord-8812');
    const docs = page.locator('section[aria-labelledby="order-docs"]');
    await expect(docs.getByRole('heading', { name: 'Documents' })).toBeVisible();
    await expect(docs.getByText('StarTrack delivery docket')).toBeVisible();
    await expect(docs.getByRole('button', { name: /Download StarTrack/ })).toBeVisible();

    await docs.getByRole('button', { name: 'Add document' }).click();
    await docs.getByLabel('Document file').setInputFiles({ name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
    await docs.getByLabel('Type').selectOption('Compliance certificate');
    await expect(docs.getByLabel('Title')).toHaveValue('cert');
    await docs.getByRole('button', { name: 'Upload' }).click();
    await expect(docs.getByText(/Document added/)).toBeVisible();
  });

  test('order history lists past orders', async ({ page }) => {
    await page.goto('/order');
    await expect(page.getByText('ORD-2026-8740').first()).toBeVisible();
  });

  test('two-factor sign-in can be found in account security', async ({ page }) => {
    await page.goto('/account?mfa=required');
    await expect(page.getByRole('heading', { name: /Two-Factor Sign-In/ })).toBeVisible();
    await expect(page.getByText(/staff accounts need two-factor/i)).toBeVisible();
  });
});

test.describe('GSS staff', () => {
  test('approve a reorder request', async ({ page }) => {
    await page.goto('/admin/reorders');
    await expect(page.getByRole('heading', { name: 'Reorder Requests' })).toBeVisible();
    const approve = page.getByRole('button', { name: /Approve & Create Order/ });
    if (!(await approve.first().isVisible())) {
      // Requests are collapsed: open the first pending one
      await page.getByText('Pending', { exact: true }).first().click();
      await page.getByRole('button', { name: /RRQ-/ }).first().click();
    }
    const before = await approve.count();
    await approve.first().click();
    await expect(approve).toHaveCount(Math.max(0, before - 1));
  });

  test('staff pages open', async ({ page }) => {
    for (const [path, heading] of [
      ['/admin', /./],
      ['/admin/orders', /./],
      ['/admin/companies', /./],
      ['/admin/audit', 'Admin — Audit Log'],
    ] as const) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(400);
      await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: heading }).first()).toBeVisible();
    }
  });

  test('audit log shows who changed what', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.getByText('PLT-4471').filter({ visible: true }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Prices' }).click();
    await expect(page).toHaveURL(/area=product_prices/);
    await expect(page.getByText(/Unit price/).filter({ visible: true }).first()).toBeVisible();
  });

  test('staff nav links to the audit log', async ({ page }) => {
    await page.goto('/admin');
    await openNav(page);
    await expect(page.getByRole('link', { name: 'Audit Log' }).first()).toBeVisible();
  });
});
