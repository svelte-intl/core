export const load = async ({ request, cookies }) => {
	const locale = cookies.get('lang');

	return {
		locale: locale ?? 'nl'
	};
};
