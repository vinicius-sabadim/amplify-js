import {
	Middleware,
	MiddlewareHandler,
	TransferClient,
	Request as RequestBase,
	Response as ResponseBase,
} from '../types/core';

type EnsureNoSameKeys<T, U> = keyof T & keyof U extends never ? true : false;
export type MergeTypeNoSameKeys<T, U> = EnsureNoSameKeys<T, U> extends true
	? T & U
	: never;

export const composeTransferClient = <
	Request extends RequestBase,
	Response extends ResponseBase,
	TransferOptions,
	MiddlewareOptions
>(
	coreClient: TransferClient<Request, Response, TransferOptions>,
	middleware?: Middleware<Request, Response, MiddlewareOptions>[]
) => {
	if (!middleware) {
		return coreClient;
	}

	return {
		send: (
			request: Request,
			options: MergeTypeNoSameKeys<MiddlewareOptions, TransferOptions>
		) => {
			let composedHandler = coreClient.send as unknown as MiddlewareHandler<
				Request,
				Response,
				MiddlewareOptions
			>;
			for (const m of middleware.reverse()) {
				composedHandler = m(composedHandler, {});
			}
			return composedHandler(request, options);
		},
	};
};
