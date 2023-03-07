import {
	Endpoint,
	Request as RequestBase,
	Response as ResponseBase,
} from './core';

export interface Credentials {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
	expiration?: Date;
}

export type SourceData = string | ArrayBuffer | ArrayBufferView;

export type ServiceClientOptions<
	Request extends RequestBase,
	Response extends ResponseBase
> = {
	modifyAfterSerialization?: (input: Request) => Promise<Request>;
	modifyBeforeDeserialization?: (input: Response) => Promise<Response>;
	endpointProvider: () => Promise<Endpoint>;
};
