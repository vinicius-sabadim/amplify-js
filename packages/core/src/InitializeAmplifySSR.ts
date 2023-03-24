import { Amplify } from './Amplify';

export function initializeSSR(req, res, config) {
	Amplify.configure(config);
	// Will need to store app client id and username as cookie to perform this lookup?
	Amplify.setContext(
		'getAccessToken',
		() =>
			req.cookies[
				'CognitoIdentityServiceProvider.7d6fe2e3f9oj9frpk047q5nqlj.username.accessToken'
			]
	);
}
