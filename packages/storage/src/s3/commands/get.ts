import {
	S3Client,
	GetObjectCommandInput,
	GetObjectCommand,
	GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { createRequest } from '@aws-sdk/util-create-request';
import { formatUrl } from '@aws-sdk/util-format-url';
import { Credentials } from '@aws-amplify/core';
import { getPrefix } from '../../common/S3ClientUtils';
import { S3ProviderGetConfig } from '../../types';
import { getStorageConfig } from '../utils';

const DEFAULT_PRESIGN_EXPIRATION = 900;

export const get = async (
	key: string,
	config?: S3ProviderGetConfig,
	sdkClientCreator?: (key: string, options: any) => Promise<S3Client> // S3 client escape hatch
): Promise<string | GetObjectCommandOutput> => {
	const s3GlobalConfig = getStorageConfig();
	const credentials = await Credentials.get(); // TODO Replace with functional credential provider
	const cred = Credentials.shear(credentials);
	const options = Object.assign({}, s3GlobalConfig, config);
	const {
		bucket,
		download,
		cacheControl,
		contentDisposition,
		contentEncoding,
		contentLanguage,
		contentType,
		expires,
		track,
		SSECustomerAlgorithm,
		SSECustomerKey,
		SSECustomerKeyMD5,
		progressCallback,
	} = options;
	const prefix = getPrefix({ ...options, credentials: cred }); // TODO Standardize prefix generation across APIs
	const final_key = prefix + key;

	// Build request & S3 command
	const params: GetObjectCommandInput = {
		Bucket: bucket,
		Key: final_key,
		ResponseCacheControl: cacheControl,
		ResponseContentDisposition: contentDisposition,
		ResponseContentEncoding: contentEncoding,
		ResponseContentLanguage: contentLanguage,
		ResponseContentType: contentType,
		SSECustomerAlgorithm: SSECustomerAlgorithm,
		SSECustomerKey: SSECustomerKey,
		SSECustomerKeyMD5: SSECustomerKeyMD5,
	};

	// Initialize client
	const sdkClient = sdkClientCreator && (await sdkClientCreator(key, options));

	// Check if we should download immediately
	if (download) {
		const command = new GetObjectCommand(params);

		if (progressCallback) {
			console.error('Progress callback not currently supported');
		}

		const response = sdkClient && (await sdkClient.send(command));

		return response as GetObjectCommandOutput;
	} else {
		// TODO How to do this with custom client? Generate client config independently of having escape hatch?
		if (sdkClient) {
			// If not downloading, generate a pre-signed URL
			const s3ClientConfig = sdkClient.config;
			const signer = s3ClientConfig && new S3RequestPresigner(s3ClientConfig);
			const request = await createRequest(
				sdkClient,
				new GetObjectCommand(params)
			);
			const url = formatUrl(
				await signer.presign(request, {
					expiresIn: expires || DEFAULT_PRESIGN_EXPIRATION,
				})
			);

			return url;
		}
	}

	return '';
};
