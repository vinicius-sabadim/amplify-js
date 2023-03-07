import { Request, Response, TransferClient } from './core';

export type Method =
	| 'GET'
	| 'HEAD'
	| 'POST'
	| 'PUT'
	| 'DELETE'; /** skip "CONNECT" |  "OPTIONS" |  "TRACE"**/

/**
 * Use basic Record interface to workaround fetch Header class not available in Node.js
 * The header names must be lowercased.
 * TODO: use LowerCase<string> intrinsic when we can support typescript 4.0
 */
export type Headers = Record<string, string>;

export interface HttpRequest extends Request {
	method: Method;
	/**
	 * Diverged from AWS SDK reference architecture where `fields` instead of `headers` is used.
	 * `fields` is a collection of headers and body trailers to support {@link https://smithy.io/2.0/aws/aws-core.html?highlight=httpchecksum#aws-protocols-httpchecksum-trait httpChecksum trait}
	 * which is essentially an S3-only feature.
	 */
	headers: Headers;
}

/**
 * Reduce the API surface of Fetch API's Body mixin to only the methods we need.
 * On platforms like React Native, some of these methods may not be available natively.
 */
export type ResponseBodyMixin = Pick<Body, 'blob' | 'json' | 'text'>;

/**
 * TODO: reason?: string property from reference architecture is out-of-scope for now.
 */
export interface HttpResponse extends Response {
	/**
	 * Adding body mixin on the HttpResponse.body is a divergence from the Fetch API,
	 * where body mixin is bound to Response object, but closer to Undici's API.
	 * Doing this to prevent calling signatures like `response.body.body`.
	 *
	 */
	body: (ResponseBodyMixin & ReadableStream) | null;
	statusCode: number;
	/**
	 * @see {@link HttpRequest.headers}
	 */
	headers: Headers;
}

export interface HttpTransferOptions {
	abortSignal?: AbortSignal;
}

export type HttpTransferClient = TransferClient<
	HttpRequest,
	HttpResponse,
	HttpTransferOptions
>;
