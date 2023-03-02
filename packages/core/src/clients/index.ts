import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { sigV4Auth, SigV4AuthOptions } from './middleware/auth';
import { composeTransferClient, composeServiceApi } from './middleware/client';
import { fetchTransferClient } from './protocol/fetch';
import { HttpRequest, HttpResponse, HttpTransferOptions } from './types/http';

export const httpClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	[RetryOptions]
>(fetchTransferClient, [jitteredBackOffRetry()]);

/**
const websocketClient = composeTransferClient<
	WebSocketRequest,
	WebSocketResponse,
	WebSocketTransferOptions,
	[RetryOptions]
>(websocketTransferClient, [jitteredBackOffRetry()]);
 */

const awsTransferClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	[RetryOptions, SigV4AuthOptions]
>(fetchTransferClient, [
	jitteredBackOffRetry<HttpRequest, HttpResponse>(),
	sigV4Auth,
]);

// AWS APIs
interface GetIdInput {
	AccountId?: string;
	IdentityPoolId: string;
	Logins?: Record<string, string>;
}
interface GetIdResponse {
	IdentityId?: string;
}
const getIdSerializer = async (input: GetIdInput): Promise<HttpRequest> => {
	return {
		headers: new Headers(),
		destination: new URL(''),
		body: JSON.stringify(input),
		method: 'GET',
	};
};
const getIdDeserializer = async (
	response: HttpResponse
): Promise<GetIdResponse> => {
	if (response.statusCode >= 300) {
		throw new Error();
	}
	if (!response.body) {
		throw new Error();
	}
	return JSON.parse(await response.body.text()) as GetIdResponse;
};

const CognitoIdentityServiceContext = {
	signingName: 'cognito-identity',
	signingRegion: 'us-east-1',
};

const cognitoGetIdApi = composeServiceApi(
	awsTransferClient,
	getIdSerializer,
	getIdDeserializer
);
const output = await cognitoGetIdApi(
	{
		IdentityPoolId: 'id',
	},
	CognitoIdentityServiceContext
);
output.IdentityId;
