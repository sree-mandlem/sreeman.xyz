import { test, expect } from '@playwright/test';

const postTitle = 'Switching Models Mid-Session in Copilot CLI';
const postDateDisplay = new Date('2026-03-22').toLocaleDateString('en-us', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
});

test.describe('Blog pages', () => {
	test('lists blog posts with metadata and tags', async ({ page }) => {
		await page.goto('/blog');
		await expect(page).toHaveTitle('Blog | Build. Break. Learn.');

		const cards = page.locator('.post-card');
		await expect(cards).toHaveCount(2);

		const firstCard = cards.first();
		await expect(firstCard.locator('.read-time')).toBeVisible();
		await expect(firstCard.locator('.read-time')).toContainText(/\d+ min read/);

		const sidebar = page.locator('aside.sidebar');
		await expect(sidebar).toBeVisible();
		await expect(sidebar).toContainText('Search & archive coming soon');
	});

	test('opens blog detail page with content', async ({ page }) => {
		await page.goto('/blog');
		await Promise.all([page.waitForNavigation(), page.getByRole('link', { name: postTitle }).click()]);

		await expect(page).toHaveURL(/\/blog\/copilot-cli-model-switching$/);
		await expect(page.getByRole('heading', { level: 1, name: postTitle })).toBeVisible();
		await expect(page.locator('.date')).toContainText(postDateDisplay);
		await expect(page.locator('.date .read-time')).toBeVisible();
		await expect(page.locator('.date .read-time')).toContainText(/\d+ min read/);
		await expect(page.locator('.prose')).toContainText("Context travels. Understanding doesn't.");
	});
});
