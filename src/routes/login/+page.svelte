<script lang="ts">
	import { enhance } from '$app/forms';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let mode = $state<'signin' | 'register'>('signin');
	$effect(() => {
		if (form?.mode === 'signin' || form?.mode === 'register') {
			mode = form.mode;
			return;
		}
		mode = data.register ? 'register' : 'signin';
	});
</script>

<svelte:head
	><title>{mode === 'register' ? 'Create an account' : 'Sign in'} — Quizer</title></svelte:head
>
<AppHeader quiet />
<main class="auth-shell">
	<section class="auth-copy">
		<p class="eyebrow">Your next quiz starts here</p>
		<h1>{mode === 'register' ? 'Make room for curiosity.' : 'Pick up where you left off.'}</h1>
		<p>Draft privately, publish when it feels right, then share a link anyone can play.</p>
	</section>
	<section class="paper auth-card">
		<div class="tabs" aria-label="Account options">
			<button
				type="button"
				aria-pressed={mode === 'signin'}
				class:active={mode === 'signin'}
				onclick={() => (mode = 'signin')}>Sign in</button
			><button
				type="button"
				aria-pressed={mode === 'register'}
				class:active={mode === 'register'}
				onclick={() => (mode = 'register')}>Create account</button
			>
		</div>
		<form method="post" action={mode === 'register' ? '?/signUp' : '?/signIn'} use:enhance>
			{#if mode === 'register'}<label class="field"
					><span>Your name</span><input name="name" autocomplete="name" required /></label
				>{/if}
			<label class="field"
				><span>Email</span><input type="email" name="email" autocomplete="email" required /></label
			>
			<label class="field"
				><span>Password</span><input
					type="password"
					name="password"
					autocomplete={mode === 'register' ? 'new-password' : 'current-password'}
					minlength="8"
					required
				/></label
			>
			{#if form?.message}<p class="form-message" role="alert">{form.message}</p>{/if}
			<button class="button" type="submit"
				>{mode === 'register' ? 'Create my account' : 'Sign in'}</button
			>
		</form>
	</section>
</main>

<style>
	.auth-shell {
		width: min(1000px, calc(100% - 2rem));
		margin: 5vh auto 8rem;
		display: grid;
		grid-template-columns: 1fr minmax(320px, 440px);
		gap: clamp(2rem, 8vw, 7rem);
		align-items: center;
	}
	.auth-copy h1 {
		font-size: clamp(2.8rem, 6vw, 5.3rem);
		margin: 0.8rem 0 1.2rem;
	}
	.auth-copy p:last-child {
		max-width: 470px;
		color: var(--muted);
		font-size: 1.05rem;
	}
	.auth-card {
		padding: 1.3rem;
	}
	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 0.85rem;
		background: var(--canvas);
		margin-bottom: 1.4rem;
	}
	.tabs button {
		padding: 0.7rem;
		border: 0;
		border-radius: 0.65rem;
		background: transparent;
		cursor: pointer;
		font-weight: 800;
	}
	.tabs button.active {
		background: white;
		box-shadow: 0 2px 10px #17233f16;
	}
	form {
		display: grid;
		gap: 1.1rem;
	}
	form .button {
		margin-top: 0.4rem;
		width: 100%;
	}
	@media (max-width: 760px) {
		.auth-shell {
			grid-template-columns: 1fr;
			margin-top: 2rem;
		}
		.auth-copy h1 {
			font-size: 2.7rem;
		}
	}
</style>
