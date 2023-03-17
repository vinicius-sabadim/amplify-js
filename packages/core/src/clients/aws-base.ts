import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { sigV4Auth, SigV4AuthOptions } from './middleware/auth/sigv4';
import { composeTransferHandler } from './internal/client';
import { fetchTransferHandler } from './fetch';
import { HttpRequest, HttpResponse } from './types/http';
import { userAgent, UserAgentOptions } from './middleware/user-agent';

export const awsTransferHandler = composeTransferHandler<
	HttpRequest,
	HttpResponse,
	typeof fetchTransferHandler,
	[UserAgentOptions, RetryOptions, SigV4AuthOptions]
>(fetchTransferHandler, [
	userAgent,
	jitteredBackOffRetry<HttpRequest, HttpResponse>(),
	sigV4Auth,
]);
