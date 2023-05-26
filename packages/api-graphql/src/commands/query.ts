import { Amplify } from '@aws-amplify/core';
import { query as queryImpl } from './implementation/query';
import { GraphQLOptions, GraphQLResult } from '../types';

export const query = async (
	options: GraphQLOptions,
	additionalHeaders?: { [key: string]: string }
): Promise<GraphQLResult> => {
	if (typeof process !== 'undefined' && process.release.name == 'node') {
		throw 'this API cannot be used server side!';
	} else {
		return await queryImpl(Amplify, options, additionalHeaders);
	}
};
