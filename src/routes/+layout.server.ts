export const load = async ({ request }) => {
	const locale = request.headers
		.get('accept-language')
		?.split(',')[0]
		.split('-')[0];

	console.log(locale);

	return {
		locale: 'nl'
	};
};
