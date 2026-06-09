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

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
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
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
