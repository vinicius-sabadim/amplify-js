import { jitteredBackOffRetry, RetryOptions } from './middleware/retry';
import { sigV4Auth, SigV4AuthOptions } from './middleware/auth';
import { composeTransferClient } from './middleware/client';
import { fetchTransferClient } from './protocol/fetch';
import { HttpRequest, HttpResponse, HttpTransferOptions } from './types/http';

export const httpClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	RetryOptions
>(fetchTransferClient, [jitteredBackOffRetry]);

const awsTransferClient = composeTransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions,
	RetryOptions & SigV4AuthOptions
>(fetchTransferClient, [jitteredBackOffRetry, sigV4Auth]);
