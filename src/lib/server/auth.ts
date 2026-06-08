import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { betterAuth } from "better-auth/minimal";
import { kyselyAdapter } from "better-auth/adapters/kysely";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

const authConfig = ({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: { enabled: true },
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
}) satisfies Omit<Parameters<typeof betterAuth>[0], "database">;

const createDb = (d1: D1Database) =>
	new Kysely({
		dialect: new D1Dialect({ database: d1 })
	});

export const createAuth = (d1: D1Database) => betterAuth({
	...authConfig,
	database: kyselyAdapter(createDb(d1), { type: "sqlite" })
});

/**
 * DO NOT USE!
 *
 * This instance is used by the `better-auth` CLI for schema generation ONLY.
 * To access `auth` at runtime, use `event.locals.auth`.
 */
export const auth = createAuth(null!);
