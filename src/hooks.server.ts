import type { Handle } from "@sveltejs/kit/hooks";

export const handle: Handle = async ({ event, resolve }) => {
	const locale = event.cookies.get('lang');

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale ?? 'nl')
	});
};