import { expect, test } from '@playwright/test';

test('introduces the quiz creator and opens registration', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1 })).toContainText('Make questions');
	await expect(page.getByLabel('Example quiz question')).toContainText(
		'Which planet has the shortest day?'
	);

	await page.getByRole('link', { name: 'Make your first quiz' }).click();

	await expect(page).toHaveURL(/\/login\?mode=register$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make room for curiosity.');
	await expect(page.getByLabel('Your name')).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
});

test('keeps primary navigation available on a narrow screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Start creating' })).toBeVisible();
});
