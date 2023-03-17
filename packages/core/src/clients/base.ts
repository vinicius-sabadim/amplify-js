import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { composeTransferHandler } from './internal/client';
import { fetchTransferHandler } from './fetch';
import { HttpRequest, HttpResponse } from './types/http';
import { userAgent, UserAgentOptions } from './middleware/user-agent';

export const httpTransferHandler = composeTransferHandler<
	HttpRequest,
	HttpResponse,
	typeof fetchTransferHandler,
	[RetryOptions, UserAgentOptions]
>(fetchTransferHandler, [jitteredBackOffRetry(), userAgent]);
