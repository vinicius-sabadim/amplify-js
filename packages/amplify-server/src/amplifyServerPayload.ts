import {
	AmplifyClass,
	AmplifyUser,
	ServerFn,
	ServerFnWrapper,
} from '@aws-amplify/core';
import { QueryType } from '@aws-amplify/api-graphql';

import { ProviderTypes } from './providers';
import { FrameworkType, FrameworkNames, NextAuth } from './frameworks';
import { JWTType } from './JWT';
import {
	CognitoIdentityClient,
	Credentials,
	GetCredentialsForIdentityCommand,
	GetIdCommand,
} from '@aws-sdk/client-cognito-identity';

export type WorkloadInput<T> = {
	awsconfig: any;
	framework: FrameworkType;
	fns: ServerFnWrapper<QueryType>[];
	// functions is an array of functions that the customer imports. These functions HAVE the amplify instance as an argument.
	// we internally create a "sandbox" object that has access to the created instance, and it creates key/value pairs for each passed function. The keys are the function names, but and the values are functions. The function signatures are the imported functions MINUS the amplify argument, but the implementation delegates to the imported function and passes the Amplify instance on behalf of the customer.

	workload: (isolate: AmplifyServerIsolate) => Promise<T>;
};

export async function AmplifyServerWorkload<T>(
	input: WorkloadInput<T>
): Promise<T> {
	const { awsconfig, fns, workload } = input;

	const amplifyInstance = new AmplifyClass();
	amplifyInstance.configure(awsconfig);

	const scopedUser = await deriveUserFromCookies(
		amplifyInstance,
		input.framework
	);

	amplifyInstance.setUser(scopedUser);

	const isolate: AmplifyServerIsolate = new AmplifyServerIsolate({
		amplifyInstance,
		fns,
	});

	return await workload(isolate);
}

export class AmplifyServerIsolate {
	amplify: AmplifyClass;
	query: QueryType;
	constructor(input: AmplifyIsolateInput) {
		this.amplify = input.amplifyInstance;

		console.log('input.fns', input.fns);

		input.fns.forEach(fn => {
			this[fn.name] = fn.fn(this.amplify);
		}, this);
	}
}

type AmplifyIsolateInput = {
	amplifyInstance: AmplifyClass;
	fns: ServerFnWrapper<QueryType>[];
};

type NotImplemented = () => Error;

async function deriveUserFromCookies(
	amplify: AmplifyClass,
	framework: FrameworkType,
	provider: ProviderTypes = ProviderTypes.COGNITO
): Promise<AmplifyUser> {
	let accessToken;
	let idToken;

	const userKey: string = constructUserKey(provider, amplify);

	switch (framework.name) {
		case FrameworkNames.Next:
			var user: string = findNextJSCookie(framework.req, userKey);
			var accessTokenKey: string = constructTokenKey(
				amplify,
				provider,
				user,
				JWTType.ACCESS_TOKEN
			);
			var idTokenKey: string = constructTokenKey(
				amplify,
				provider,
				user,
				JWTType.ID_TOKEN
			);
			accessToken = findNextJSCookie(framework.req, accessTokenKey);
			idToken = findNextJSCookie(framework.req, idTokenKey);
			break;
		// case FrameworkType.NUXTJS:
		// 	var user: string = findNuxtJSCookie(input.req, userKey);
		// 	var accessTokenKey: string = constructTokenKey(
		// 		provider,
		// 		user,
		// 		JWTType.ACCESS_TOKEN
		// 	);
		// 	var idTokenKey: string = constructTokenKey(
		// 		provider,
		// 		user,
		// 		JWTType.ID_TOKEN
		// 	);
		// 	accessToken = findNuxtJSCookie(input.req, accessTokenKey);
		// 	idToken = findNuxtJSCookie(input.req, idTokenKey);
		// 	break;
		// case FrameworkType.ASTRO:
		// 	var user: string = input.req.cookies.get(userKey).value;
		// 	var accessTokenKey: string = constructTokenKey(
		// 		provider,
		// 		user,
		// 		JWTType.ACCESS_TOKEN
		// 	);
		// 	var idTokenKey: string = constructTokenKey(
		// 		provider,
		// 		user,
		// 		JWTType.ID_TOKEN
		// 	);
		// 	accessToken = input.req.cookies.get(accessTokenKey).value;
		// 	idToken = input.req.cookies.get(idTokenKey).value;
		// case FrameworkType.SOLIDSTART:
		// 	var user: string = findSolidStartCookie(input.req, userKey);
		// 	var accessTokenKey: string = constructTokenKey(
		// 		provider,
		// 		user,
		// 		JWTType.ACCESS_TOKEN
		// 	);
		// 	var idTokenKey: string = constructTokenKey(
		// 		provider,
		// 		user,
		// 		JWTType.ID_TOKEN
		// 	);
		// 	accessToken = findSolidStartCookie(input.req, accessTokenKey);
		// 	idToken = findSolidStartCookie(input.req, idTokenKey);
	}

	const identityId: string | undefined = await getId(amplify, idToken);
	let credentials: Credentials | undefined;

	if (identityId) {
		credentials = await getCredentials(amplify, idToken, identityId);
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
	amplify: AmplifyClass,
	provider: ProviderTypes,
	user: string,
	jwtType: JWTType
) {
	switch (provider) {
		default:
			const { aws_user_pools_web_client_id } = amplify.getConfig();
			return `${provider}.${aws_user_pools_web_client_id}.${user}.${jwtType}`;
	}
}

function constructUserKey(provider: ProviderTypes, amplify: AmplifyClass) {
	switch (provider) {
		default:
			const { aws_user_pools_web_client_id } = amplify.getConfig();
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
	amplify: AmplifyClass,
	idToken: string,
	identityId: string
): Promise<Credentials | undefined> {
	const { aws_cognito_region, aws_user_pools_id } = amplify.getConfig();
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

async function getId(
	amplify: AmplifyClass,
	idToken: string
): Promise<string | undefined> {
	const {
		aws_cognito_region,
		aws_cognito_identity_pool_id,
		aws_user_pools_id,
	} = amplify.getConfig();

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
