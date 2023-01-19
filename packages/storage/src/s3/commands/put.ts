import { Amplify, parseAWSExports } from '@aws-amplify/core';
import { S3ProviderPutConfig } from '../../types';

export const put = (key: string, object: any, config?: S3ProviderPutConfig) => {
	const amplifyConfig = parseAWSExports(Amplify.getConfig()) as any;
	const storageConfig = amplifyConfig?.Storage;

	if (storageConfig) {
		throw Error('Storage has not been configured.');
	}

	const options = Object.assign({}, storageConfig, config);
};
