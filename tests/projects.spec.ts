import { test, expect } from '@playwright/test';

const projectTitle = 'Personal AI Portfolio and Learning Lab';
const projectDateDisplay = new Date('2026-03-21').toLocaleDateString('en-us', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
});

test.describe('Projects page', () => {
	test('displays project cards with metadata, tech, and links', async ({ page }) => {
		await page.goto('/projects');
		await expect(page).toHaveTitle('Projects | Build. Break. Learn.');

		const projectCard = page
			.locator('.projects .card')
			.filter({ has: page.getByRole('heading', { level: 2, name: projectTitle }) })
			.first();

		await expect(projectCard).toBeVisible();
		await expect(projectCard.locator('.card__date')).toContainText(projectDateDisplay);
		await expect(projectCard.locator('.card__description')).toContainText(
			'Personal portfolio and learning lab documenting my journey in AI, software development, and experiments.',
		);

		const techPills = projectCard.locator('.card__tech-pill');
		await expect(techPills).toHaveText(['typescript', 'cloudflare', 'astro']);

		const githubLink = projectCard.getByRole('link', { name: 'GitHub' });
		await expect(githubLink).toHaveAttribute('href', 'https://github.com/sree-mandlem/sreeman.xyz');
	});
});
