import { generateSvelteHelpers } from '@uploadthing/svelte';
import type { UploadRouter } from '$lib/server/uploadthing';

export const { createUploader, createUploadThing, uploadFiles } =
	generateSvelteHelpers<UploadRouter>();
