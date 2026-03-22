import { test, expect } from '@playwright/test';

const experimentTitle = 'Exploring Astro for My Portfolio on Cloudflare';
const experimentDateDisplay = new Date('2026-03-21').toLocaleDateString('en-us', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
});

test.describe('Experiments page', () => {
	test('shows experiment cards and visual indicators', async ({ page }) => {
		await page.goto('/experiments');
		await expect(page).toHaveTitle('Experiments | Build. Break. Learn.');

		await expect(page.locator('.intro .emoji')).toHaveText('🧪');

		const cards = page.locator('.experiment-card');
		await expect(cards).toHaveCount(2);

		const astroCard = cards.filter({ hasText: experimentTitle });
		await expect(astroCard.locator('.card-icon')).toHaveText('🧪');
		await expect(astroCard.getByRole('heading', { level: 2, name: experimentTitle })).toBeVisible();
		await expect(astroCard.locator('.card-meta')).toContainText(experimentDateDisplay);
		await expect(astroCard.locator('.card-content > p')).toContainText(
			'Trying out Astro to understand if it fits a content-first portfolio setup',
		);
	});
});
