import { Endpoint } from './core';
import { HttpRequest, HttpResponse } from './http';

export interface Credentials {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
	expiration?: Date;
}

export type SourceData = string | ArrayBuffer | ArrayBufferView;

export type ServiceClientOptions<EndpointResolverOptions = { region: string }> =
	{
		region: string;
		modifyAfterSerialization?: (input: HttpRequest) => Promise<HttpRequest>;
		modifyBeforeDeserialization?: (
			input: HttpResponse
		) => Promise<HttpResponse>;
		endpointResolver: (input: EndpointResolverOptions) => Endpoint;
	};
