# Quizer

Quizer is an image-rich quiz creator built with SvelteKit and Convex. Signed-in creators can
draft quizzes, add ordered questions and answers, attach UploadThing images with accessible
descriptions, choose answer keys, and publish a shareable link. Players can answer without an
account and receive a server-scored review without exposing the answer key beforehand.

## Stack

- Svelte 5, SvelteKit, TypeScript, and Tailwind CSS
- Convex for quiz data, authorization, publishing, and scoring
- Better Auth with Convex-backed email/password sessions
- UploadThing for quiz, question, and answer images
- Cloudflare Workers, Varlock/Bitwarden secrets, and optional Better Stack logging
- Vitest, `convex-test`, browser component tests, and Playwright E2E tests

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
- `PUBLIC_CONVEX_URL`: Convex client URL ending in `.convex.cloud`.
- `PUBLIC_CONVEX_SITE_URL`: Convex site URL ending in `.convex.site`.
- `UPLOADTHING_TOKEN`: private UploadThing API token.

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

The app remains browsable without Convex variables in local development, but authentication,
authoring, publishing, and scoring require a configured Convex deployment. Image uploads also
require `UPLOADTHING_TOKEN`.

## Product routes

- `/` — product landing page
- `/login` — registration and sign-in
- `/dashboard` — creator quiz library
- `/dashboard/new` — create a quiz
- `/dashboard/quizzes/[quizId]` — question, answer, media, and publishing editor
- `/quiz/[slug]` — public quiz player and scored review

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

## Verification

```sh
pnpm check
pnpm lint
pnpm test:unit -- --run
pnpm test:e2e
pnpm build
```

On NixOS, enter `nix develop` first. The development shell includes Chromium's runtime
libraries so browser tests work without a separate FHS environment.
