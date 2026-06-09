import { Logtail } from '@logtail/edge';
import { env as privateEnv } from '$env/dynamic/private';
import type { HandleServerError, RequestEvent } from '@sveltejs/kit';

const defaultEndpoint = 'https://in.logs.betterstack.com';
const disabledValues = new Set(['0', 'false', 'off', 'no']);

type Context = Record<string, unknown>;
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type BetterStackLogger = Pick<
	ReturnType<Logtail['withExecutionContext']>,
	'error' | 'info' | 'log' | 'warn'
>;

type BetterStackConfig = {
	sourceToken?: string;
	ingestingHost?: string;
	logRequests?: string;
};

type RequestLogInput = {
	event: RequestEvent;
	response: Response;
	durationMs: number;
};

type ErrorLogInput = Parameters<HandleServerError>[0];

let baseLogger: Logtail | undefined;
let baseLoggerToken: string | undefined;
let baseLoggerEndpoint: string | undefined;

export const getBetterStackEndpoint = (ingestingHost: string | undefined) => {
	if (!ingestingHost) {
		return defaultEndpoint;
	}

	if (ingestingHost.startsWith('https://') || ingestingHost.startsWith('http://')) {
		return ingestingHost;
	}

	return `https://${ingestingHost}`;
};

export const isRequestLoggingEnabled = (value: string | undefined) =>
	!value || !disabledValues.has(value.toLowerCase());

export const getStatusLogLevel = (status: number): LogLevel => {
	if (status >= 500) {
		return 'error';
	}

	if (status >= 400) {
		return 'warn';
	}

	return 'info';
};

const getBaseLogger = ({ sourceToken, ingestingHost }: BetterStackConfig) => {
	if (!sourceToken) {
		return null;
	}

	const endpoint = getBetterStackEndpoint(ingestingHost);

	if (baseLogger && baseLoggerToken === sourceToken && baseLoggerEndpoint === endpoint) {
		return baseLogger;
	}

	baseLogger = new Logtail(sourceToken, {
		endpoint,
		captureStackContext: false,
		warnAboutMissingExecutionContext: false
	});
	baseLoggerToken = sourceToken;
	baseLoggerEndpoint = endpoint;

	return baseLogger;
};

const getLogger = (event: RequestEvent): BetterStackLogger | null => {
	const logger = getBaseLogger({
		sourceToken: privateEnv.BETTER_STACK_SOURCE_TOKEN,
		ingestingHost: privateEnv.BETTER_STACK_INGESTING_HOST
	});

	if (!logger) {
		return null;
	}

	if (event.platform?.ctx) {
		return logger.withExecutionContext(event.platform.ctx);
	}

	return logger;
};

export const getRequestLogContext = ({ event, response, durationMs }: RequestLogInput): Context => {
	const url = new URL(event.request.url);
	const ray = event.request.headers.get('cf-ray');

	return {
		http: {
			method: event.request.method,
			path: url.pathname,
			status_code: response.status,
			duration_ms: durationMs
		},
		url: {
			host: url.host
		},
		user: event.locals.user ? { id: event.locals.user.id } : undefined,
		cloudflare: ray ? { ray } : undefined
	};
};

const log = (event: RequestEvent, level: LogLevel, message: string | Error, context: Context) => {
	const logger = getLogger(event);

	if (!logger) {
		return;
	}

	void logger.log(message, level, context).catch(() => undefined);
};

export const logRequest = (input: RequestLogInput) => {
	if (!isRequestLoggingEnabled(privateEnv.BETTER_STACK_LOG_REQUESTS)) {
		return;
	}

	log(
		input.event,
		getStatusLogLevel(input.response.status),
		'http_request',
		getRequestLogContext(input)
	);
};

export const logServerError = (input: ErrorLogInput) => {
	const message = input.error instanceof Error ? input.error : 'Unhandled server error';

	log(input.event, 'error', message, {
		http: {
			method: input.event.request.method,
			path: new URL(input.event.request.url).pathname,
			status_code: input.status
		},
		sveltekit: {
			message: input.message
		}
	});
};
