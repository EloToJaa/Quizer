import { query } from './_generated/server';

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => ctx.auth.getUserIdentity()
});
