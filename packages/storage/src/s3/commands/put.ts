import { Amplify, parseAWSExports } from '@aws-amplify/core';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { S3ProviderPutConfig } from '../../types';

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

	// Initialize the upload client

	// Upload file
	// TODO Handle multi-part uploads
	// TODO Handle resumable uploads
	// TODO Support for progress callback

	return Promise.resolve(true);
};
