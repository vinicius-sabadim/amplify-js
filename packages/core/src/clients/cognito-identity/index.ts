import { HttpRequest } from '../types/http';

export * from './get-id';
export * from './get-credentials-for-identity';

export const getDefaultContext = (options: { region: string }) => ({
	service: 'cognito-identity',
	endpointProvider: () =>
		Promise.resolve({
			url: new URL(`https://cognito-identity.${options.region}.amazonaws.com`),
		}),
	modifyAfterSerialization: async (input: HttpRequest) => {
		input.headers['cache-control'] = 'no-store';
		return input;
	},
});
