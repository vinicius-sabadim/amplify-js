import { Amplify } from './Amplify';

export enum SSRType {
	NEXTJS = 'NEXTJS',
	NUXTJS = 'NUXTJS',
	ASTRO = 'ASTRO',
	SOLIDSTART = 'SOLIDSTART',
}

export type AccessToken = string;

export enum ProviderTypes {
	COGNITO = 'CognitoIdentityServiceProvider',
}

export type initializeSSRInput = {
	req: any;
	res: any;
	config: any;
	tokenRetrieval: SSRType | AccessToken;
};

export function initializeSSR(
	input: initializeSSRInput,
	provider: ProviderTypes = ProviderTypes.COGNITO
) {
	Amplify.configure(input.config);

	// Will need to store app client id and username as cookie to perform this lookup?
	Amplify.setContext('getAccessToken', () => {
		console.log('hit getAccessToken');
		let accessToken;

		const userKey: string = constructUserKey(provider);

		switch (input.tokenRetrieval) {
			case SSRType.NEXTJS:
				var user: string = findNextJSCookie(input.req, userKey);
				var accessTokenKey: string = constructAccessTokenKey(provider, user);
				accessToken = findNextJSCookie(input.req, accessTokenKey);
				break;
			case SSRType.NUXTJS:
				var user: string = findNuxtJSCookie(input.req, userKey);
				var accessTokenKey: string = constructAccessTokenKey(provider, user);
				accessToken = findNuxtJSCookie(input.req, accessTokenKey);
				break;
			case SSRType.ASTRO:
				var user: string = input.req.cookies.get(userKey).value;
				var accessTokenKey: string = constructAccessTokenKey(provider, user);
				accessToken = input.req.cookies.get(accessTokenKey).value;
			case SSRType.SOLIDSTART:
				var user: string = findSolidStartCookie(input.req, userKey);
				var accessTokenKey: string = constructAccessTokenKey(provider, user);
				accessToken = findSolidStartCookie(input.req, accessTokenKey);
		}
		return accessToken;
	});
}

function findNextJSCookie(req: any, key: string) {
	return req.cookies[key] ?? req.cookies.get(key).value;
}

function findNuxtJSCookie(req: any, key: string) {
	return req?.headers.cookie
		? parseCookies(req?.headers.cookie)[key]
		: parseCookies(document?.cookie)[key];
}

function findSolidStartCookie(req: any, key: string) {
	return parseCookies(req.headers.get('Cookie'))[key];
}

function constructAccessTokenKey(provider: ProviderTypes, user: string) {
	switch (provider) {
		default:
			const { aws_user_pools_web_client_id } = Amplify.getConfig();
			return `${provider}.${aws_user_pools_web_client_id}.${user}.accessToken`;
	}
}

function constructUserKey(provider: ProviderTypes) {
	switch (provider) {
		default:
			const { aws_user_pools_web_client_id } = Amplify.getConfig();
			return `${provider}.${aws_user_pools_web_client_id}.LastAuthUser`;
	}
}

function parseCookies(cookieString): Object {
	var cookies = {};
	console.log('parseCookies: start', cookieString);

	cookies = cookieString.split(';').reduce((res, c) => {
		const [key, val] = c.trim().split('=').map(decodeURIComponent);
		const allNumbers = str => /^\d+$/.test(str);
		try {
			return Object.assign(res, {
				[key]: allNumbers(val) ? val : JSON.parse(val),
			});
		} catch (e) {
			return Object.assign(res, { [key]: val });
		}
	}, {});
	// for (var i = 0; i < cookieString.length; i++) {
	// 	var nameValue = cookieString[i].split('=');
	// 	cookies[nameValue[0].trim()] = nameValue[1];
	// }
	console.log('parseCookies: end', cookies);
	return cookies;
}
