import { Amplify, parseAWSExports } from '@aws-amplify/core';
import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import * as events from 'events';
import {
	createS3Client,
	DEFAULT_PART_SIZE,
	createPrefixMiddleware,
	prefixMiddlewareOptions,
} from '../../common/S3ClientUtils';
import { S3ProviderPutConfig } from '../../types';
import { byteLength, validateAndSanitizeBody } from '../utils';

export const put = (
	key: string,
	object: any,
	config?: S3ProviderPutConfig
): Promise<any> => {
	const amplifyConfig = parseAWSExports(Amplify.getConfig()) as any;
	const s3GlobalConfig = amplifyConfig?.Storage.AWSS3;

	if (!s3GlobalConfig) {
		throw Error('S3 has not been configured.');
	}

	// Build request options & S3 command
	const options = Object.assign({}, s3GlobalConfig, config);
	const {
		bucket,
		track,
		progressCallback,
		level,
		resumable,
		contentType,
		contentDisposition,
		contentEncoding,
		cacheControl,
		expires,
		metadata,
		tagging,
		acl,
		serverSideEncryption,
		SSECustomerAlgorithm,
		SSECustomerKey,
		SSECustomerKeyMD5,
		SSEKMSKeyId,
	} = options;

	const putParams: PutObjectCommandInput = {
		Bucket: bucket,
		Key: key,
		Body: object,
		ContentType: contentType ? contentType : 'binary/octet-stream',
		CacheControl: cacheControl,
		ContentDisposition: contentDisposition,
		ContentEncoding: contentEncoding,
		Expires: expires,
		Metadata: metadata,
		Tagging: tagging,
		ServerSideEncryption: serverSideEncryption,
		SSECustomerAlgorithm: SSECustomerAlgorithm,
		SSECustomerKey: SSECustomerKey,
		SSECustomerKeyMD5: SSECustomerKeyMD5,
		SSEKMSKeyId: SSEKMSKeyId,
	};

	// Initialize new upload client
	// TODO Investigate sharing client between APIs & impact to tree-shaking
	const emitter = new events.EventEmitter();
	const s3client = createS3Client(options, emitter); // TODO Swap out credential provider

	// Setup client middleware
	s3client.middlewareStack.add(
		createPrefixMiddleware(options, key),
		prefixMiddlewareOptions
	);

	// Upload file
	const sanitizedBody = validateAndSanitizeBody(putParams.Body);
	const fileSize = byteLength(sanitizedBody);

	if (fileSize <= DEFAULT_PART_SIZE) {
		putParams.Body = sanitizedBody;
		const putObjectCommand = new PutObjectCommand(putParams);
		console.log('putObjectCommand', putObjectCommand);
		return s3client.send(putObjectCommand);

		// TODO Handle resumable uploads
		// TODO Add progress callback
	} else {
		// TODO Hand multi-part uploads. Should this be broken into it's own API for tree-shaking? Use existing class or refactor?
	}

	return Promise.resolve(true);
};
