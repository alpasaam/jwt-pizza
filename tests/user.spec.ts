import { test, expect } from 'playwright-test-coverage';

test('updateUser', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  let currentUser: { id: string; name: string; email: string; roles: { role: string }[] } = {
    id: '1',
    name: 'pizza diner',
    email,
    roles: [{ role: 'diner' }],
  };
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      currentUser = { id: '1', name: body.name, email: body.email, roles: [{ role: 'diner' }] };
      await route.fulfill({ json: { user: currentUser, token: 't' } });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({ json: { user: currentUser, token: 't' } });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, json: {} });
    }
  });
  await page.route('*/**/api/user/me', async (route) => {
    await route.fulfill({ json: currentUser });
  });
  await page.route(/\/api\/user\/[^?]+$/, async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      currentUser = { ...currentUser, ...body, id: currentUser.id };
      await route.fulfill({ json: { user: currentUser, token: 't' } });
    }
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('admin lists users', async ({ page }) => {
  const adminUser = { id: '1', name: 'Admin User', email: 'a@jwt.com', roles: [{ role: 'admin' }] };
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: { user: adminUser, token: 't' } });
    }
  });
  await page.route('*/**/api/user/me', async (route) => {
    await route.fulfill({ json: adminUser });
  });
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    await route.fulfill({ json: { franchises: [], more: false } });
  });
  await page.route(/\/api\/user\?/, async (route) => {
    await route.fulfill({ json: { users: [adminUser], more: false } });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('main')).toContainText('Users');
  await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
});

test('admin deletes user', async ({ page }) => {
  const name = `deleteMe${Math.floor(Math.random() * 10000)}`;
  const email = `del${Math.floor(Math.random() * 10000)}@jwt.com`;
  const adminUser = { id: '0', name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] };
  const registeredUser = { id: '99', name, email, roles: [{ role: 'diner' }] };
  let deletedIds = new Set<string>();
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ json: { user: { id: '99', name: body.name, email: body.email, roles: [{ role: 'diner' }] }, token: 't' } });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({ json: { user: adminUser, token: 't' } });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, json: {} });
    }
  });
  await page.route('*/**/api/user/me', async (route) => {
    await route.fulfill({ json: adminUser });
  });
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    await route.fulfill({ json: { franchises: [], more: false } });
  });
  await page.route(/\/api\/user\?/, async (route) => {
    const url = new URL(route.request().url());
    const nameFilter = url.searchParams.get('name') || '*';
    let users: typeof adminUser[] = nameFilter === '*' ? [adminUser] : [];
    if (!deletedIds.has(registeredUser.id!) && nameFilter.includes(name)) users.push(registeredUser);
    await route.fulfill({ json: { users, more: false } });
  });
  await page.route(/\/api\/user\/[^?]+$/, async (route) => {
    if (route.request().method() === 'DELETE') {
      const id = route.request().url().split('/').pop();
      deletedIds.add(id!);
      await route.fulfill({ status: 200, json: {} });
    }
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill(name);
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('pass');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByPlaceholder('Filter users').fill(name);
  await page.getByRole('table').nth(1).getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('main')).toContainText(name);
  await page.getByRole('table').locator('tr').filter({ hasText: name }).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('table').nth(1).getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('main')).not.toContainText(name);
});
