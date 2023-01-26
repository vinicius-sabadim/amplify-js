import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest, HttpResponse } from '@aws-sdk/types';

import {
	Machine,
	MachineManager,
} from '@aws-amplify/auth/lib-esm/stateMachine';

type ClientStates =
	| 'idle'
	| 'configured'
	| 'serialized'
	| 'built'
	| 'retry'
	| 'sign'
	| 'send'
	| 'deserialization'
	| 'error'
	| 'done';

type ClientContext = {};

type InputEvent = {
	name: 'input';
	payload: {
		params: any;
	};
};

type ErrorEvent = {
	name: 'error';
	payload: {
		error: Error;
	};
};

type ConfigEvent = {
	name: 'config';
	payload: {
		region: string;
		params: any;
	};
};

type RequestEvent = {
	name: 'request';
	payload: {
		request: HttpRequest;
	};
};

type ResponseEvent = {
	name: 'response';
	payload: {
		response: HttpResponse;
	};
};

type ClientEvents =
	| InputEvent
	| ConfigEvent
	| RequestEvent
	| ResponseEvent
	| ErrorEvent;

export const authorizedClient = (name, serializer, deserializer, logger) => {
	const machine = new Machine<ClientContext, ClientEvents, ClientStates>({
		name: 'authorizedClient',
		initial: 'idle',
		context: {},
		states: {
			idle: {
				input: [
					{
						nextState: 'configured',
						reducers: [],
						effects: [],
					},
				],
			},
			configured: {
				input: [],
			},
			serialized: {},
			built: {},
			retry: {},
			sign: {},
			send: {},
			deserialization: {},
			done: {},
			error: {},
		},
	});
	return {
		send: async (params: any) => {
			const manager = await new MachineManager({ name, logger });
			manager.addMachineIfAbsent(machine);
			const res = await manager.send({
				name: 'start',
				payload: { params },
				toMachine: machine.name,
			});
			if (res.currentState !== 'done') {
				throw new Error(
					`State machine in ${res.currentState} state; ${manager}`
				);
			} else {
				// @ts-ignore
				return res.context.result;
			}
		},
	};
};
