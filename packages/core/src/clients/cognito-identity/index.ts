export * from './get-id';
export * from './get-credentials-for-identity';

export const CognitoIdentityServiceContext = {
	service: 'cognito-identity',
	endpointProvider: () =>
		Promise.resolve({
			url: new URL('https://cognito-identity.us-east-1.amazonaws.com'),
		}),
};
