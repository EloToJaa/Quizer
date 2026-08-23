<script lang="ts">
	import type { UploadMedia } from '$lib/types/quizzes';
	import { uploadFiles } from '$lib/utils/uploadthing';

	let {
		value = $bindable(),
		endpoint,
		label = 'Add image'
	}: { value?: UploadMedia; endpoint: 'quizImage' | 'answerImage'; label?: string } = $props();
	let uploading = $state(false);
	let error = $state('');

	const select = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		error = '';

		try {
			const [uploaded] = await uploadFiles(endpoint, { files: [file] });
			if (!uploaded) return;
			value = {
				key: uploaded.key,
				url: uploaded.url,
				name: uploaded.name,
				size: uploaded.size,
				...(uploaded.type ? { type: uploaded.type } : {})
			};
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Upload failed. Try another image.';
		} finally {
			uploading = false;
			input.value = '';
		}
	};
</script>

<div class="media-picker" class:has-image={Boolean(value)}>
	{#if value}
		<img src={value.url} alt={value.alt ?? ''} />
		<div class="media-actions">
			<span title={value.name}>{value.name}</span>
			<button type="button" class="link danger" onclick={() => (value = undefined)}>Remove</button>
		</div>
		<label class="description">
			<span>Image description</span>
			<input bind:value={value.alt} maxlength="240" placeholder="Describe what the image shows" />
		</label>
	{:else}
		<label class="upload-label">
			<span>{uploading ? 'Uploading…' : label}</span>
			<small>PNG, JPG, WEBP or GIF</small>
			<input type="file" accept="image/*" disabled={uploading} onchange={select} />
		</label>
	{/if}
	{#if error}<p class="field-error" role="alert">{error}</p>{/if}
</div>

<style>
	.media-picker {
		min-height: 7rem;
		border: 2px dashed var(--line-strong);
		border-radius: 1rem;
		background: color-mix(in srgb, var(--blue-pale) 65%, white);
		overflow: hidden;
	}
	.upload-label {
		min-height: 7rem;
		display: grid;
		place-content: center;
		text-align: center;
		cursor: pointer;
		color: var(--blue);
		font-weight: 800;
	}
	.upload-label:focus-within {
		outline: 3px solid color-mix(in srgb, var(--blue) 35%, transparent);
		outline-offset: -3px;
	}
	.upload-label small {
		color: var(--muted);
		font: 600 0.68rem var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-top: 0.35rem;
	}
	input[type='file'] {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
	img {
		width: 100%;
		max-height: 16rem;
		object-fit: cover;
		display: block;
	}
	.media-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 0.8rem;
		gap: 1rem;
	}
	.media-actions span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.75rem;
	}
	.description {
		display: grid;
		gap: 0.35rem;
		padding: 0.7rem 0.8rem 0.85rem;
		border-top: 1px solid var(--line);
	}
	.description span {
		font: 800 0.65rem var(--font-mono);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.description input {
		min-height: 2.5rem !important;
		padding: 0.55rem 0.65rem !important;
		font-size: 0.8rem;
	}
	.field-error {
		margin: 0.5rem;
	}
</style>
