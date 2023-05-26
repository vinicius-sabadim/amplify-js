import { AmplifyClass } from './Amplify';
import { GraphQLOptions, Query, QueryImpl } from './types/GraphQL/types';

export type WorkloadInput<T> = {
	awsconfig: any;
	fns: Function[];
	// functions is an array of functions that the customer imports. These functions HAVE the amplify instance as an argument.
	// we internally create a "sandbox" object that has access to the created instance, and it creates key/value pairs for each passed function. The keys are the function names, but and the values are functions. The function signatures are the imported functions MINUS the amplify argument, but the implementation delegates to the imported function and passes the Amplify instance on behalf of the customer.

	workload: (isolate: AmplifyServerIsolate) => Promise<T>;
};

export async function AmplifyServerWorkload<T>(
	input: WorkloadInput<T>
): Promise<T> {
	const { awsconfig, fns, workload } = input;

	const amplifyInstance = new AmplifyClass();
	amplifyInstance.configure(awsconfig);

	const isolate: AmplifyServerIsolate = new AmplifyServerIsolate({
		amplifyInstance,
		query: fns['query'],
	});

	return await workload(isolate);
}

export class AmplifyServerIsolate {
	amplify: AmplifyClass;
	query: Query | NotImplemented = () => Error('Not implemented');
	constructor(input: AmplifyIsolateInput) {
		this.amplify = input.amplifyInstance;
		if (input.query != undefined) {
			this.query = async (
				options: GraphQLOptions,
				additionalHeaders?: { [key: string]: string }
			) => {
				return await input.query(this.amplify, options, additionalHeaders);
			};
		}
	}
}

type AmplifyIsolateInput = {
	amplifyInstance: AmplifyClass;
	query: QueryImpl;
};

type NotImplemented = () => Error;

export type ServerFn = (amplify: AmplifyClass, ...args: any) => Function;
