import {
	httpTransferClient,
	composeTransferClient,
	Middleware,
	HttpRequest,
	HttpResponse,
} from '../../clients';

const disableCacheMiddleware: Middleware<HttpRequest, HttpResponse, {}> = (
	next,
	context
) =>
	async function disableCacheMiddleware(request) {
		request.headers['cache-control'] = 'no-store';
		return next(request, context);
	};

export const cognitoIdentityTransferClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	typeof httpTransferClient,
	[{}]
>(httpTransferClient, [disableCacheMiddleware]);

export const defaultConfigs = {
	service: 'cognito-identity',
	endpointResolver: (endpointOptions: { region: string }) => ({
		url: new URL(
			`https://cognito-identity.${endpointOptions.region}.amazonaws.com`
		),
	}),
};
