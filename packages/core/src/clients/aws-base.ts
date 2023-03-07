import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { sigV4Auth, SigV4AuthOptions } from './middleware/auth/sigv4';
import { composeTransferClient } from './internal/client';
import { fetchTransferClient } from './protocol/fetch';
import { HttpRequest, HttpResponse, HttpTransferOptions } from './types/http';
import { userAgent, UserAgentOptions } from './middleware/user-agent';

export const awsTransferClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	[UserAgentOptions, RetryOptions, SigV4AuthOptions]
>(fetchTransferClient, [
	userAgent,
	jitteredBackOffRetry<HttpRequest, HttpResponse>(),
	sigV4Auth,
]);
