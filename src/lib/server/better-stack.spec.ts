import { describe, expect, it } from 'vitest';
import {
	getBetterStackEndpoint,
	getRequestLogContext,
	getStatusLogLevel,
	isRequestLoggingEnabled
} from './better-stack';
import type { RequestEvent } from '@sveltejs/kit';

const requestEvent = (url: string): RequestEvent =>
	({
		request: new Request(url, {
			headers: { 'cf-ray': 'ray-id' }
		}),
		locals: {
			user: { id: 'user-id' }
		}
	}) as RequestEvent;

describe('Better Stack configuration', () => {
	it('uses the default Better Stack ingest endpoint when no host is configured', () => {
		expect(getBetterStackEndpoint(undefined)).toBe('https://in.logs.betterstack.com');
	});

	it('normalizes ingesting hosts without mutating full endpoint URLs', () => {
		expect(getBetterStackEndpoint('custom.logs.betterstack.com')).toBe(
			'https://custom.logs.betterstack.com'
		);
		expect(getBetterStackEndpoint('https://custom.logs.betterstack.com')).toBe(
			'https://custom.logs.betterstack.com'
		);
	});

	it('keeps request logging enabled unless explicitly disabled', () => {
		expect(isRequestLoggingEnabled(undefined)).toBe(true);
		expect(isRequestLoggingEnabled('false')).toBe(false);
		expect(isRequestLoggingEnabled('OFF')).toBe(false);
	});
});

describe('Better Stack request logs', () => {
	it('maps HTTP status classes to useful log levels', () => {
		expect(getStatusLogLevel(200)).toBe('info');
		expect(getStatusLogLevel(404)).toBe('warn');
		expect(getStatusLogLevel(503)).toBe('error');
	});

	it('records request metadata without query string values', () => {
		const context = getRequestLogContext({
			event: requestEvent('https://quiz.example.test/demo?token=secret'),
			response: new Response(null, { status: 201 }),
			durationMs: 12
		});

		expect(context).toMatchObject({
			http: {
				method: 'GET',
				path: '/demo',
				status_code: 201,
				duration_ms: 12
			},
			url: { host: 'quiz.example.test' },
			user: { id: 'user-id' },
			cloudflare: { ray: 'ray-id' }
		});
		expect(JSON.stringify(context)).not.toContain('secret');
	});
});
