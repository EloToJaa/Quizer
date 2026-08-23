import { describe, expect, it, vi } from 'vitest';
import { UploadThingError } from 'uploadthing/server';
import { requireUploadUser } from './uploadthing';

const request = new Request('https://quizer.example.test/api/uploadthing');

describe('UploadThing authentication', () => {
	it('returns serializable user metadata for an authenticated request', async () => {
		const readSession = vi.fn().mockResolvedValue({
			session: { id: 'session-id' },
			user: { id: 'user-id' }
		});

		await expect(
			requireUploadUser(request, 'https://example.convex.site', readSession)
		).resolves.toEqual({ userId: 'user-id' });
	});

	it('rejects unauthenticated requests with an UploadThing error', async () => {
		const readSession = vi.fn().mockResolvedValue(null);

		const result = requireUploadUser(request, 'https://example.convex.site', readSession);

		await expect(result).rejects.toBeInstanceOf(UploadThingError);
		await expect(result).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});
});
