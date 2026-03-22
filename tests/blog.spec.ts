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
		await expect(cards).toHaveCount(1);

		const firstCard = cards.first();
		await expect(firstCard.getByRole('link', { name: postTitle })).toBeVisible();
		await expect(firstCard.locator('time')).toHaveText(postDateDisplay);
		await expect(firstCard.locator('.post-description')).toContainText(
			'When you switch AI models mid-session',
		);

		const tags = firstCard.locator('.tag-list li');
		await expect(tags).toHaveCount(3);
		await expect(tags).toHaveText(['copilot', 'ai', 'developer-workflow']);

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
		await expect(page.locator('.prose')).toContainText("Context travels. Understanding doesn't.");
	});
});
