import { query as queryImpl } from '../implementation/query';
import { GraphQLOptions, GraphQLResult } from '../../types';
import { AmplifyClass } from '@aws-amplify/core';
import { ServerFn } from '@aws-amplify/core/src/amplifyServerPayload';

let amplify: AmplifyClass;

// export const query = async (
// 	options: GraphQLOptions,
// 	additionalHeaders?: { [key: string]: string }
// ): Promise<GraphQLResult> => {
// 	return queryImpl(amplify, options, additionalHeaders);
// };

export const ServerQuery: ServerFn = function (amplify: AmplifyClass) {
	return (
		options: GraphQLOptions,
		additionalHeaders?: { [key: string]: string }
	) => {
		return queryImpl(amplify, options, additionalHeaders);
	};
};
