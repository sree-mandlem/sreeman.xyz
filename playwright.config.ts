import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	retries: isCI ? 1 : 0,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:4321',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chromium'] }
		}
	],
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:4321',
		reuseExistingServer: true,
		timeout: 120_000
	}
});
