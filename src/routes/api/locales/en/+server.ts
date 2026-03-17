import en from '$test/locales/en.json' with { type: 'json' };

export const GET = async () => {
	return new Response(JSON.stringify(en), {
		headers: { 'Content-Type': 'application/json' }
	});
};
