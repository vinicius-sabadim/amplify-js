import { httpClient } from '../base';
import { composeServiceApi } from '../internal/client';
import { Endpoint } from '../types/core';
import { HttpRequest, HttpResponse } from '../types/http';
import { parseBody, throwError } from '../protocol/rest-json';

export interface GetCredentialsForIdentityInput {
	IdentityId: string;
	Logins?: Record<string, string>;
	CustomRoleArn?: string;
}
export interface GetCredentialsForIdentityResponse {
	IdentityId?: string;
	Credentials?: Credentials;
}

interface Credentials {
	AccessKeyId?: string;
	SecretKey?: string;
	SessionToken?: string;
	Expiration?: Date;
}

const getCredentialsForIdentitySerializer = async (
	input: GetCredentialsForIdentityInput,
	endpoint: Endpoint
): Promise<HttpRequest> => {
	return {
		headers: new Headers({
			'content-type': 'application/x-amz-json-1.1',
			'x-amz-target': 'AWSCognitoIdentityService.GetCredentialsForIdentity',
		}),
		method: 'POST',
		destination: endpoint.url,
		body: JSON.stringify(input),
	};
};

const getCredentialsForIdentityDeserializer = async (
	response: HttpResponse
): Promise<GetCredentialsForIdentityResponse> => {
	if (response.statusCode >= 300) {
		throw await throwError(response);
	} else {
		const body = await parseBody(response);

		return {
			...body,
			Credentials: {
				...body.Credentials,
				Expiration: new Date(body.Credentials.Expiration * 1000),
			},
		} as GetCredentialsForIdentityResponse;
	}
};

export const getCredentialsForIdentity = composeServiceApi(
	httpClient,
	getCredentialsForIdentitySerializer,
	getCredentialsForIdentityDeserializer
);
