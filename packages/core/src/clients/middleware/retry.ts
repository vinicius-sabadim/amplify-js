import { Middleware, Request, Response } from '../types/core';

/**
 * TODO
 */
export interface RetryOptions {
	maxRetries?: number;
	maxDelayMs?: number;
}

export const jitteredBackOffRetry: Middleware<
	Request,
	Response,
	RetryOptions
> = (next, context) => async (request, options) => {
	// TODO: implement jittered exponential back-off retry.
	const response = await next(request, options);
	return response;
};
