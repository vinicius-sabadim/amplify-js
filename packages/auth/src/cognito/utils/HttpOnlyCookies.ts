import { Amplify } from '@aws-amplify/core';

export function useHttpOnlyCookies(httpOnlyCookieConfig: HttpOnlyCookieConfig) {
	Amplify.setContext('Auth', {
		httpOnlyCookieConfig,
	});
}
type HttpOnlyCookieConfig = {
	tokenConversionHandler: TokenConversionHandler;
	httpOnlyCookieRefreshHandler: HttpOnlyCookieRefreshHandler;
};
type TokenConversionHandler = (
	cookieKey: string,
	refreshToken: string
) => Promise<void>;
type HttpOnlyCookieRefreshHandler = (
	cookieKey: string,
	refreshToken: string
) => Promise<void>;
