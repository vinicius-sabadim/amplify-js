import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { composeTransferClient } from './internal/client';
import { fetchTransferClient } from './protocol/fetch';
import { HttpRequest, HttpResponse, HttpTransferOptions } from './types/http';
import { userAgent, UserAgentOptions } from './middleware/user-agent';

export const httpClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	[RetryOptions, UserAgentOptions]
>(fetchTransferClient, [jitteredBackOffRetry(), userAgent]);
