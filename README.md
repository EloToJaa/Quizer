# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.15.4 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:typography" better-auth="demo:password" paraglide="languageTags:en, pl+demo:yes" --install pnpm quizer
```

## Managing environment secrets

This project uses [Varlock](https://varlock.dev) to validate `.env` files and to resolve secrets from Bitwarden Secrets Manager.

1. Copy `.env.example` to `.env.local`.
2. Fill non-secret local values in `.env.local`.
3. For shared secrets, store the secret in Bitwarden Secrets Manager and use its UUID:

```sh
BETTER_AUTH_SECRET=bitwarden("00000000-0000-0000-0000-000000000000")
```

4. Provide the machine account token through your shell or deployment platform:

```sh
export BITWARDEN_ACCESS_TOKEN='0.client_id.client_secret:encryption_key'
```

Run `pnpm env:check` to validate the environment. App scripts run through `varlock run`, so resolved and validated values are injected automatically.

Required application variables:

- `SITE_URL`: public SvelteKit app URL.
- `BETTER_AUTH_SECRET`: Better Auth secret; prefer a Bitwarden-backed value outside local-only development.
- `CONVEX_DEPLOYMENT`: Convex deployment name written by the Convex CLI.
- `PUBLIC_CONVEX_SITE_URL`: Convex site URL ending in `.convex.site`.

## Developing

Once you've installed dependencies with `pnpm install`, start a development server:

```sh
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

Run the Convex development server in another terminal:

```sh
pnpm convex
```

## Better Stack logs

Server-side request and SvelteKit error logs are sent to Better Stack when
`BETTER_STACK_SOURCE_TOKEN` is configured.

Set `BETTER_STACK_INGESTING_HOST` when your Better Stack source uses a custom
ingesting host. Set `BETTER_STACK_LOG_REQUESTS=false` to keep error logging
enabled while disabling request summary logs.

## Building

To create a production version of your app:

```sh
pnpm build
```

You can preview the production build with `pnpm preview`.
