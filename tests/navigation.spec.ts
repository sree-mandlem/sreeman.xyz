import { test, expect } from '@playwright/test';

const navLinks = [
	{ name: 'Home', path: '/' },
	{ name: 'Blog', path: '/blog' },
	{ name: 'Experiments', path: '/experiments' },
	{ name: 'Projects', path: '/projects' },
	{ name: 'About', path: '/about' },
] as const;

test.describe('Global navigation & layout', () => {
	for (const link of navLinks) {
		test(`renders header, footer, and active state on ${link.name} page`, async ({ page }) => {
			await page.goto(link.path);

			const headerNav = page.locator('header nav');
			await expect(headerNav).toBeVisible();

			for (const nav of navLinks) {
				const navItem = headerNav.getByRole('link', { name: nav.name, exact: true });
				await expect(navItem).toBeVisible();
			}

			const activeLink = headerNav.locator('.internal-links a.active');
			await expect(activeLink).toHaveText(link.name);

			const siteFooter = page.locator('body > footer');
			await expect(siteFooter).toBeVisible();
		});
	}

	test('header links navigate to the right pages', async ({ page }) => {
		await page.goto('/');

		for (const link of navLinks) {
			const navItem = page.locator('header').getByRole('link', { name: link.name, exact: true });
			const alreadyOnPage = new URL(page.url()).pathname === link.path;
			if (alreadyOnPage) {
				await navItem.click();
			} else {
				await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), navItem.click()]);
			}
			await expect.poll(() => new URL(page.url()).pathname).toBe(link.path);
		}
	});

	test('renders correctly on a mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		await expect(page.locator('header nav')).toBeVisible();
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: /Bold experiments from a curious engineer/i,
			}),
		).toBeVisible();
	});
});
