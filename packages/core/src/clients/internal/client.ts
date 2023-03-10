import { ServiceClientOptions } from '../types/aws';
import {
	Middleware,
	MiddlewareHandler,
	TransferClient,
	Request as RequestBase,
	Response as ResponseBase,
	Endpoint,
} from '../types/core';
import { HttpRequest, HttpResponse } from '../types/http';

type OptionToMiddleware<
	Request,
	Response,
	Options extends any[]
> = Options extends [infer LastOption]
	? [Middleware<Request, Response, LastOption>]
	: Options extends [infer FirstOption, ...infer RestOptions]
	? [
			Middleware<Request, Response, FirstOption>,
			...OptionToMiddleware<Request, Response, RestOptions>
	  ]
	: never;

type EnsureNoConflictKeys<T, U> = Pick<U, keyof T & keyof U> extends Pick<
	T,
	keyof T & keyof U
>
	? true
	: false;
type MergeTwoNoConflictKeys<T, U> = EnsureNoConflictKeys<T, U> extends true
	? T & U
	: never;
type MergeNoConflictKeys<Options extends any[]> = Options extends [
	infer OnlyOption
]
	? OnlyOption
	: Options extends [infer FirstOption, infer SecondOption]
	? MergeTwoNoConflictKeys<FirstOption, SecondOption>
	: Options extends [infer FirstOption, ...infer RestOptions]
	? MergeTwoNoConflictKeys<FirstOption, MergeNoConflictKeys<RestOptions>>
	: never;

type InferOptionTypeFromTransferClient<
	T extends TransferClient<any, any, any>
> = Parameters<T['send']>[1];

export const composeTransferClient = <
	Request extends RequestBase,
	Response extends ResponseBase,
	CoreClient extends TransferClient<Request, Response, any>,
	MiddlewareOptionsArr extends any[]
>(
	coreClient: CoreClient,
	middleware: OptionToMiddleware<Request, Response, MiddlewareOptionsArr>
) => {
	return {
		send: (
			request: Request,
			options: MergeNoConflictKeys<
				[...MiddlewareOptionsArr, InferOptionTypeFromTransferClient<CoreClient>]
			>
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

type OptionalizeKey<T, K> = Omit<T, K & keyof T> & {
	[P in K & keyof T]?: T[P];
};
export const composeServiceApi = <
	Input,
	Output,
	TransferClientOptions,
	DefaultConfig extends Partial<TransferClientOptions & ServiceClientOptions>
>(
	transferClient: TransferClient<
		HttpRequest,
		HttpResponse,
		TransferClientOptions
	>,
	serializer: (input: Input, endpoint: Endpoint) => Promise<HttpRequest>,
	deserializer: (output: HttpResponse) => Promise<Output>,
	defaultConfig: DefaultConfig
) => {
	return async (
		config: OptionalizeKey<
			TransferClientOptions & ServiceClientOptions,
			keyof DefaultConfig
		>,
		input: Input
	) => {
		const resolvedConfig = {
			...defaultConfig,
			...config,
		} as unknown as TransferClientOptions & ServiceClientOptions;

		// For S3 access point, the endpoint can be configured by both configure and input.
		const endpoint = await resolvedConfig.endpointResolver({
			...resolvedConfig,
			...input,
		});
		let request = await serializer(input, endpoint);
		if (config.modifyAfterSerialization) {
			request = await config.modifyAfterSerialization(request);
		}
		let response = await transferClient.send(request, resolvedConfig);
		if (config.modifyBeforeDeserialization) {
			response = await config.modifyBeforeDeserialization(response);
		}
		return await deserializer(response);
	};
};
