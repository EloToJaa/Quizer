import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AppHeader from './AppHeader.svelte';

describe('AppHeader', () => {
	it('offers account entry points to a guest', async () => {
		const screen = await render(AppHeader);

		await expect
			.element(screen.getByRole('link', { name: 'Sign in' }))
			.toHaveAttribute('href', '/login');
		await expect
			.element(screen.getByRole('link', { name: 'Start creating' }))
			.toHaveAttribute('href', '/login?mode=register');
	});

	it('shows quiz navigation and sign out to an authenticated creator', async () => {
		const screen = await render(AppHeader, { user: { name: 'Ada', email: 'ada@example.test' } });

		await expect
			.element(screen.getByRole('link', { name: 'My quizzes' }))
			.toHaveAttribute('href', '/dashboard');
		await expect.element(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
	});
});
