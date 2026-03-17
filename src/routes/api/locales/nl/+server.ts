import nl from '$test/locales/nl.json' with { type: 'json' };

export const GET = async () => {
	return new Response(JSON.stringify(nl), {
		headers: { 'Content-Type': 'application/json' }
	});
};
