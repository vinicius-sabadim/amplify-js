import {
	CognitoIdentityClient,
	Credentials,
	GetCredentialsForIdentityCommand,
	GetIdCommand,
} from '@aws-sdk/client-cognito-identity';
import { Amplify, AmplifyUser } from './Amplify';
import { log } from 'console';

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

enum JWTType {
	ACCESS_TOKEN = 'accessToken',
	ID_TOKEN = 'idToken',
}

export type initializeSSRInput = {
	req: any;
	// RES not always available, such as in NextJS Edge runtime
	res: any;
	config: any;
	tokenRetrieval: SSRType | AccessToken;
};

export async function initializeSSR(
	input: initializeSSRInput,
	provider: ProviderTypes = ProviderTypes.COGNITO
) {
	Amplify.configure(input.config);

	Amplify.setUser(await deriveUserFromCookies(input, provider));
}

async function deriveUserFromCookies(
	input: initializeSSRInput,
	provider: ProviderTypes = ProviderTypes.COGNITO
): Promise<AmplifyUser> {
	let accessToken;
	let idToken;

	const userKey: string = constructUserKey(provider);

	switch (input.tokenRetrieval) {
		case SSRType.NEXTJS:
			var user: string = findNextJSCookie(input.req, userKey);
			var accessTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ACCESS_TOKEN
			);
			var idTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ID_TOKEN
			);
			accessToken = findNextJSCookie(input.req, accessTokenKey);
			idToken = findNextJSCookie(input.req, idTokenKey);
			break;
		case SSRType.NUXTJS:
			var user: string = findNuxtJSCookie(input.req, userKey);
			var accessTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ACCESS_TOKEN
			);
			var idTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ID_TOKEN
			);
			accessToken = findNuxtJSCookie(input.req, accessTokenKey);
			idToken = findNuxtJSCookie(input.req, idTokenKey);
			break;
		case SSRType.ASTRO:
			var user: string = input.req.cookies.get(userKey).value;
			var accessTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ACCESS_TOKEN
			);
			var idTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ID_TOKEN
			);
			accessToken = input.req.cookies.get(accessTokenKey).value;
			idToken = input.req.cookies.get(idTokenKey).value;
		case SSRType.SOLIDSTART:
			var user: string = findSolidStartCookie(input.req, userKey);
			var accessTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ACCESS_TOKEN
			);
			var idTokenKey: string = constructTokenKey(
				provider,
				user,
				JWTType.ID_TOKEN
			);
			accessToken = findSolidStartCookie(input.req, accessTokenKey);
			idToken = findSolidStartCookie(input.req, idTokenKey);
	}

	const identityId: string | undefined = await getId(idToken);
	let credentials: Credentials | undefined;

	if (identityId) {
		credentials = await getCredentials(idToken, identityId);
	}

	const result: AmplifyUser = {
		isSignedIn: true,
		accessToken: accessToken,
		idToken: idToken,
	};

	if (credentials) {
		result.awsCreds = {
			accessKey: credentials.AccessKeyId!,
			secretKey: credentials.SecretKey!,
			sessionToken: credentials.SessionToken!,
			identityId: identityId!,
		};
	}

	return result;
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

function constructTokenKey(
	provider: ProviderTypes,
	user: string,
	jwtType: JWTType
) {
	switch (provider) {
		default:
			const { aws_user_pools_web_client_id } = Amplify.getConfig();
			return `${provider}.${aws_user_pools_web_client_id}.${user}.${jwtType}`;
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
	console.log('parseCookies: end', cookies);
	return cookies;
}

async function getCredentials(
	idToken: string,
	identityId: string
): Promise<Credentials | undefined> {
	const { aws_cognito_region, aws_user_pools_id } = Amplify.getConfig();
	const client = new CognitoIdentityClient({ region: aws_cognito_region });
	const loginsKey = `cognito-idp.${aws_cognito_region}.amazonaws.com/${aws_user_pools_id}`;
	const logins = {};
	logins[loginsKey] = idToken;
	const input = {
		// GetCredentialsForIdentityInput
		IdentityId: identityId, // required
		Logins: logins,
	};
	const command = new GetCredentialsForIdentityCommand(input);
	const response = await client.send(command);
	return response.Credentials;
}

async function getId(idToken: string): Promise<string | undefined> {
	const {
		aws_cognito_region,
		aws_cognito_identity_pool_id,
		aws_user_pools_id,
	} = Amplify.getConfig();

	const client = new CognitoIdentityClient({
		region: aws_cognito_region,
	});
	const loginsKey = `cognito-idp.${aws_cognito_region}.amazonaws.com/${aws_user_pools_id}`;
	const logins = {};
	logins[loginsKey] = idToken;
	const input = {
		IdentityPoolId: aws_cognito_identity_pool_id, // required
		Logins: logins,
	};
	const command = new GetIdCommand(input);
	const response = await client.send(command);
	return response.IdentityId;
}
