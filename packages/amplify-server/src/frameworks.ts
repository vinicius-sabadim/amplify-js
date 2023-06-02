export interface FrameworkType {
	name: string;
	req: any;
	res?: any;
	version?: string;
}

export class NextAuth implements FrameworkType {
	name = FrameworkNames.Next;
	req: any;
	res: any;
	constructor(req, res?) {
		this.req = req;
		this.res = res;
	}
}

export enum FrameworkNames {
	Next = 'Next',
}
