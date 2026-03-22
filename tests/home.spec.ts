import { test, expect } from '@playwright/test';

const heroHeading =
	/Bold experiments from a curious engineer/i;

test.describe('Home page', () => {
	test('shows hero and introduction sections', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle('Build. Break. Learn.');
		await expect(page.locator('.hero .eyebrow')).toHaveText('Build. Break. Learn.');
		await expect(page.getByRole('heading', { level: 1, name: heroHeading })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'Why this site exists' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'What you\'ll find here' })).toBeVisible();
	});

	test('links to core sections from cards', async ({ page }) => {
		const destinations = [
			{ name: 'Blog', path: '/blog' },
			{ name: 'Projects', path: '/projects' },
			{ name: 'Experiments', path: '/experiments' },
		] as const;

		for (const destination of destinations) {
			await page.goto('/');
			const cardLink = page.locator('.cards').getByRole('link', {
				name: new RegExp(`^${destination.name}\\b`),
			});
			await expect(cardLink).toBeVisible();
			await Promise.all([page.waitForNavigation(), cardLink.click()]);
			await expect.poll(() => new URL(page.url()).pathname).toBe(destination.path);
		}
	});

	test('renders footer content', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('footer');
		await expect(footer).toBeVisible();
		await expect(footer).toContainText('Sreeman');
	});
});
