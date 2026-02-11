import { test, expect } from 'playwright-test-coverage';
import { Role, User } from '../src/service/pizzaService';
import { Page } from '@playwright/test';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

async function basicInit(page: Page) {
    let loggedInUser: User | undefined;
    const validUsers: Record<string, User> = { 'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] } };
  
    // Authorize login for the given user
    await page.route('*/**/api/auth', async (route) => {
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUsers[loginReq.email];
      const loginRes = {
        user: loggedInUser,
        token: 'abcdef',
      };
      expect(route.request().method()).toBe('PUT');
      await route.fulfill({ json: loginRes });
    });
  
    // Return the currently logged in user
    await page.route('*/**/api/user/me', async (route) => {
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: loggedInUser });
    });
  
    // A standard menu
    await page.route('*/**/api/order/menu', async (route) => {
      const menuRes = [
        {
          id: 1,
          title: 'Veggie',
          image: 'pizza1.png',
          price: 0.0038,
          description: 'A garden of delight',
        },
        {
          id: 2,
          title: 'Pepperoni',
          image: 'pizza2.png',
          price: 0.0042,
          description: 'Spicy treat',
        },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
    });
  
    // Standard franchises and stores
    await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
      const franchiseRes = {
        franchises: [
          {
            id: 2,
            name: 'LotaPizza',
            stores: [
              { id: 4, name: 'Lehi' },
              { id: 5, name: 'Springville' },
              { id: 6, name: 'American Fork' },
            ],
          },
          { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
          { id: 4, name: 'topSpot', stores: [] },
        ],
      };
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    });
  
    // Order a pizza.
    await page.route('*/**/api/order', async (route) => {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: orderRes });
    });
  
    await page.goto('/');
  }
  
  test('login', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
  
    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  });
  
  test('purchase with login', async ({ page }) => {
    await basicInit(page);
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
  });

  test('about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
    await expect(page.getByText(/secret behind our delicious pizzas/)).toBeVisible();
  });

  test('history page', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
    await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
  });

  test('not found page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
    await expect(page.getByText('dropped a pizza on the floor')).toBeVisible();
  });

  test('docs page', async ({ page }) => {
    await page.route('**/api/docs', async (route) => {
      await route.fulfill({
        json: {
          endpoints: [
            {
              requiresAuth: false,
              method: 'GET',
              path: '/api/order/menu',
              description: 'Get menu',
              example: 'GET /api/order/menu',
              response: { items: [] },
            },
          ],
        },
      });
    });
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
  });

  test('register', async ({ page }) => {
    const newUser = { id: '10', name: 'Jane Doe', email: 'jane@jwt.com', roles: [{ role: Role.Diner }] };
    await page.route('*/**/api/auth', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({ json: { user: { ...newUser, name: body.name }, token: 'xyz123' } });
      }
    });
    await page.route('*/**/api/user/me', async (route) => {
      await route.fulfill({ json: newUser });
    });
    await page.goto('/register');
    await page.getByPlaceholder('Full name').fill('Jane Doe');
    await page.getByPlaceholder('Email address').fill('jane@jwt.com');
    await page.getByPlaceholder('Password').fill('secret');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('link', { name: 'JD' })).toBeVisible();
  });

  test('logout', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
    await page.unroute('*/**/api/auth');
    await page.route('*/**/api/auth', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, json: {} });
      } else {
        const user = { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] };
        await route.fulfill({ json: { user, token: 'abcdef' } });
      }
    });
    await page.goto('/logout');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
  });

  test('diner dashboard with orders', async ({ page }) => {
    await basicInit(page);
    await page.unroute('*/**/api/order');
    await page.route('*/**/api/order', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            orders: [
              {
                id: '23',
                franchiseId: '3',
                storeId: '7',
                date: '2024-01-15T12:00:00',
                items: [
                  { menuId: '1', description: 'Veggie', price: 0.0038 },
                  { menuId: '2', description: 'Pepperoni', price: 0.0042 },
                ],
              },
            ],
          },
        });
      } else {
        const orderReq = route.request().postDataJSON();
        await route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
      }
    });
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
    await page.goto('/diner-dashboard');
    await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
    await expect(page.getByText('Here is your history of all the good times')).toBeVisible();
    await expect(page.locator('tbody')).toContainText('23');
    await expect(page.locator('tbody')).toContainText('0.008 ₿');
  });

  test('diner dashboard empty orders', async ({ page }) => {
    await page.route('*/**/api/auth', async (route) => {
      if (route.request().method() === 'PUT') {
        const user = { id: '3', name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: Role.Diner }] };
        await route.fulfill({ json: { user, token: 'abc' } });
      }
    });
    await page.route('*/**/api/user/me', async (route) => {
      await route.fulfill({ json: { id: '3', name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: Role.Diner }] } });
    });
    await page.route('*/**/api/order', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { orders: [] } });
      }
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
    await page.goto('/diner-dashboard');
    await expect(page.getByText(/How have you lived this long without having a pizza/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buy one' })).toBeVisible();
  });