import {
	ListObjectsV2Request,
	S3Client,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Credentials } from '@aws-amplify/core';
import { getPrefix, createS3Client } from '../../common/S3ClientUtils';
import {
	S3ProviderListConfig,
	S3ClientOptions,
	S3ProviderListOutput,
} from '../../types';
import { getStorageConfig } from '../utils';

const MAX_PAGE_SIZE = 1000;

const queryS3 = async (
	path: string,
	params: ListObjectsV2Request,
	options: S3ClientOptions,
	client?: S3Client
): Promise<S3ProviderListOutput> => {
	const credentials = await Credentials.get(); // TODO Replace with functional credential provider
	const cred = Credentials.shear(credentials);
	const prefix = getPrefix({ ...options, credentials: cred }); // TODO Standardize prefix generation across APIs
	const final_path = prefix + path;
	params.Prefix = final_path;

	const listOutput: S3ProviderListOutput = {
		results: [],
		hasNextToken: false,
	};
	const listObjectsV2Command = new ListObjectsV2Command({ ...params });
	const response = client && (await client.send(listObjectsV2Command));

	if (response && response.Contents) {
		listOutput.results = response.Contents.map(item => {
			return {
				key: item.Key?.substr(prefix.length),
				eTag: item.ETag,
				lastModified: item.LastModified,
				size: item.Size,
			};
		});
		listOutput.nextToken = response.NextContinuationToken;
		listOutput.hasNextToken = !!response.IsTruncated;
	}

	return listOutput;
};

export const list = async (
	path: string,
	config?: S3ProviderListConfig,
	sdkClientCreator?: (key: string, options: any) => Promise<S3Client> // S3 client escape hatch
): Promise<S3ProviderListOutput> => {
	const s3GlobalConfig = getStorageConfig();

	// Build request options & S3 command
	const options = Object.assign({}, s3GlobalConfig, config) as S3ClientOptions;
	const { bucket, track, pageSize, nextToken } = options;
	const params: ListObjectsV2Request = {
		Bucket: bucket,
		MaxKeys: MAX_PAGE_SIZE,
		ContinuationToken: nextToken,
	};

	// Initialize client
	const listOutput: S3ProviderListOutput = {
		results: [],
		hasNextToken: false,
	};
	let queryResult: S3ProviderListOutput;
	const sdkClient = sdkClientCreator && (await sdkClientCreator(path, options));

	if (pageSize === 'ALL') {
		// Automatically iterate over all pages
		do {
			queryResult = await queryS3(path, params, options, sdkClient);
			listOutput.results.push(...queryResult.results);

			if (queryResult.nextToken)
				params.ContinuationToken = queryResult.nextToken;
		} while (queryResult.nextToken);
	} else {
		// Return requested page
		if (pageSize && pageSize <= MAX_PAGE_SIZE) {
			params.MaxKeys = pageSize;
		} else {
			console.error(`pageSize should be from 0 - ${MAX_PAGE_SIZE}.`);
		}

		queryResult = await queryS3(path, params, options, sdkClient);
		listOutput.results.push(...listOutput.results);
		listOutput.hasNextToken = listOutput.hasNextToken;
		listOutput.nextToken = null ?? listOutput.nextToken;
	}

	return listOutput;
};
