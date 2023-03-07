import { HttpRequest, HttpResponse } from '../types/http';
import {
	MiddlewareContext,
	MiddlewareHandler,
	Request,
	Response,
	Middleware,
} from '../types/core';

export interface UserAgentOptions {
	userAgentHeader?: string;
	userAgentValue?: string;
}

export const userAgent: Middleware<
	HttpRequest,
	HttpResponse,
	UserAgentOptions
> = (next, context) => {
	return async function userAgent(request, options) {
		if (options.userAgentValue ?? ''.trim().length === 0) {
			return await next(request, options);
		} else {
			// TODO: implement jittered exponential back-off retry.
			const headerName = options.userAgentHeader ?? 'x-amz-user-agent';
			if (request.headers[headerName]) {
				request.headers[
					headerName
				] = `${request.headers[headerName]} ${options.userAgentValue}`;
			} else {
				request.headers[headerName] = options.userAgentValue;
			}
			const response = await next(request, options);
			return response;
		}
	};
};
