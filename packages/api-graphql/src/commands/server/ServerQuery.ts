import { query as queryImpl } from '../implementation/query';
import {
	GraphQLOptions,
	GraphQLResult,
	QueryType,
	// ServerGraphQLFn,
} from '../../types';
import { AmplifyClass, ServerFn, ServerFnWrapper } from '@aws-amplify/core';

let amplify: AmplifyClass;

const ServerQueryFn: ServerFn<QueryType> = function (amplify: AmplifyClass) {
	let t: QueryType = (
		options: GraphQLOptions,
		additionalHeaders?: { [key: string]: string }
	) => {
		return queryImpl(amplify, options, additionalHeaders);
	};
	return t;
};

export const ServerQuery: ServerFnWrapper<QueryType> = {
	fn: ServerQueryFn,
	name: 'query',
};
