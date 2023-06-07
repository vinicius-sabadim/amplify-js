export interface FrameworkType {
	name: string;
	context: any;
	version?: string;
}

export class NextAuth implements FrameworkType {
	name = FrameworkNames.Next;
	context: any;
	constructor(context) {
		this.context = context;
	}
}

export class NuxtAuth implements FrameworkType {
	name = FrameworkNames.Nuxt;
	context: any;
	constructor(context) {
		this.context = context;
	}
}

export enum FrameworkNames {
	Next = 'Next',
	Nuxt = 'Nuxt',
}
