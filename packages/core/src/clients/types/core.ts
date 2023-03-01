/**
 * General None HTTP-specific request interface
 */
export interface Request {
	destination: URL;
	body: unknown;
}

export interface Response {
	body: unknown;
}

export interface TransferClient<Request, Response, TransferOptions> {
	send: (request: Request, options: TransferOptions) => Promise<Response>;
}

/**
 * A slimmed down version of the AWS SDK v3 middleware handler, only handling instantiated requests
 */
export type MiddlewareHandler<Request, Response, MiddlewareOptions> = (
	request: Request,
	options: MiddlewareOptions
) => Promise<Response>;

/**
 * A slimmed down version of the AWS SDK v3 middleware, only handling tasks after Serde.
 */
export type Middleware<Request, Response, MiddlewareOptions> = (
	next: MiddlewareHandler<Request, Response, MiddlewareOptions>,
	context: Record<string, unknown>
) => MiddlewareHandler<Request, Response, MiddlewareOptions>;

export type ComposeServiceApi<Input, Output, Request, Response, Options> = (
	transferClient: TransferClient<Request, Response, Options>,
	serializer: (input: Input) => Promise<Request>,
	deserializer: (output: Response) => Promise<Output>
) => (input: Input, options: Options) => Promise<Output>;
