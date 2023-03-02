import { Middleware } from '../types/core';
import { HttpRequest, HttpResponse } from '../types/http';

/**
 * TODO
 */
export interface SigV4AuthOptions {
	signingRegion: string;
	signingName: string;
}

export const sigV4Auth: Middleware<
	HttpRequest,
	HttpResponse,
	SigV4AuthOptions
> = (next, context) =>
	async function sigV4Auth(request, options) {
		/**
		 * TODO: implement SigV4 signing.
		 */
		return next(request, options);
	};

/**
 * TODO
 */
export interface JwtAuthOptions {
	jwtProvider: () => Promise<string>;
}

export const jwtAuth: Middleware<HttpRequest, HttpResponse, JwtAuthOptions> = (
	next,
	context
) =>
	async function jwtAuth(request, options) {
		/**
		 * TODO: implement jwt auth
		 */
		return next(request, options);
	};

/**
 * TODO
 */
export interface ApiKeyAuthOptions {
	apiKeyProvider: () => Promise<string>;
}

export const apiKeyAuth: Middleware<
	HttpRequest,
	HttpResponse,
	JwtAuthOptions
> = (next, context) =>
	async function apiKeyAuth(request, options) {
		/**
		 * TODO: implement api key auth
		 */
		return next(request, options);
	};
