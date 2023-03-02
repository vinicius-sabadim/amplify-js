import { Middleware } from './core';

export type OptionToMiddleware<
	Request,
	Response,
	Options extends any[]
> = Options extends [infer LastOption]
	? [Middleware<Request, Response, LastOption>]
	: Options extends [infer FirstOption, ...infer RestOptions]
	? [
			Middleware<Request, Response, FirstOption>,
			...OptionToMiddleware<Request, Response, RestOptions>
	  ]
	: never;

type EnsureNoSameKeys<T, U> = keyof T & keyof U extends never ? true : false;
type MergeTwoNoSameKeys<T, U> = EnsureNoSameKeys<T, U> extends true
	? T & U
	: never;
export type MergeNoSameKeys<Options extends any[]> = Options extends [
	infer OnlyOption
]
	? OnlyOption
	: Options extends [infer FirstOption, infer SecondOption]
	? MergeTwoNoSameKeys<FirstOption, SecondOption>
	: Options extends [infer FirstOption, ...infer RestOptions]
	? MergeTwoNoSameKeys<FirstOption, MergeNoSameKeys<RestOptions>>
	: never;
