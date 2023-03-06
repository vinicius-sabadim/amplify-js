import { httpClient } from '../base';
import { composeServiceApi } from '../internal/client';
import { Endpoint } from '../types/core';
import { HttpRequest, HttpResponse } from '../types/http';
import { parseBody, throwError } from '../protocol/rest-json';

export interface GetIdInput {
	AccountId?: string;
	IdentityPoolId: string;
	Logins?: Record<string, string>;
}
export interface GetIdResponse {
	IdentityId?: string;
}

const getIdSerializer = async (
	input: GetIdInput,
	endpoint: Endpoint
): Promise<HttpRequest> => {
	return {
		headers: new Headers({
			'content-type': 'application/x-amz-json-1.1',
			'x-amz-target': 'AWSCognitoIdentityService.GetId',
		}),
		method: 'POST',
		destination: endpoint.url,
		body: JSON.stringify(input),
	};
};

const getIdDeserializer = async (
	response: HttpResponse
): Promise<GetIdResponse> => {
	if (response.statusCode >= 300) {
		throw await throwError(response);
	} else {
		const body = await parseBody(response);
		return body as GetIdResponse;
	}
};

export const getId = composeServiceApi(
	httpClient,
	getIdSerializer,
	getIdDeserializer
);

// const output = cognitoGetIdApi(
//   {
//     ...CognitoIdentityServiceContext,
//   },
//   {
//     IdentityPoolId: "id",
//   }
// );
