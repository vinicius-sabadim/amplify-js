import {
	MiddlewareHandler,
	TransferClient,
	Request as RequestBase,
	Response as ResponseBase,
} from '../types/core';
import { OptionToMiddleware, MergeNoSameKeys } from '../types/util';

export const composeTransferClient = <
	Request extends RequestBase,
	Response extends ResponseBase,
	TransferOptions,
	MiddlewareOptionsArr extends any[]
>(
	coreClient: TransferClient<Request, Response, TransferOptions>,
	middleware: OptionToMiddleware<Request, Response, MiddlewareOptionsArr>
) => {
	return {
		send: (
			request: Request,
			options: MergeNoSameKeys<[...MiddlewareOptionsArr, TransferOptions]>
		) => {
			let composedHandler = coreClient.send as unknown as MiddlewareHandler<
				Request,
				Response,
				MiddlewareOptionsArr[number]
			>;
			for (const m of middleware.reverse()) {
				composedHandler = m(composedHandler, {});
			}
			return composedHandler(request, options);
		},
	};
};

export const composeServiceApi =
	<
		Input,
		Output,
		Request extends RequestBase,
		Response extends ResponseBase,
		Options
	>(
		transferClient: TransferClient<Request, Response, Options>,
		serializer: (input: Input) => Promise<Request>,
		deserializer: (output: Response) => Promise<Output>
	) =>
	async (input: Input, options: Options) => {
		const request = await serializer(input);
		const response = await transferClient.send(request, options);
		return await deserializer(response);
	};
