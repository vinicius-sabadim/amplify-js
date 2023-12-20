// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Hub, decodeJWT } from '@aws-amplify/core';
import { handleFailure } from '../../../../../src/providers/cognito/utils/oauth/handleFailure';
import { validateState } from '../../../../../src/providers/cognito/utils/oauth/validateState';
import { resolveAndClearInflightPromises } from '../../../../../src/providers/cognito/utils/oauth/inflightPromise';
import { oAuthStore } from '../../../../../src/providers/cognito/utils/oauth/oAuthStore';
import { cacheCognitoTokens } from '../../../../../src/providers/cognito/tokenProvider/cacheTokens';
import { AuthError } from '../../../../../src/errors/AuthError';
import { AuthErrorTypes } from '../../../../../src/types/Auth';
import { OAuthStore } from '../../../../../src/providers/cognito/utils/types';
import { getCurrentUser } from '../../../../../src/providers/cognito/apis/getCurrentUser';

import { completeOAuthFlow } from '../../../../../src/providers/cognito/utils/oauth/completeOAuthFlow';

jest.mock('@aws-amplify/core', () => ({
	Hub: {
		dispatch: jest.fn(),
	},
	decodeJWT: jest.fn(),
	ConsoleLogger: jest.fn(),
}));
jest.mock('../../../../../src/providers/cognito/utils/oauth//handleFailure');
jest.mock('../../../../../src/providers/cognito/utils/oauth/validateState');
jest.mock('../../../../../src/providers/cognito/utils/oauth/inflightPromise');
jest.mock('../../../../../src/providers/cognito/apis/getCurrentUser');
jest.mock('../../../../../src/providers/cognito/tokenProvider/cacheTokens');
jest.mock(
	'../../../../../src/providers/cognito/utils/oauth/oAuthStore',
	() => ({
		oAuthStore: {
			setAuthConfig: jest.fn(),
			storeOAuthInFlight: jest.fn(),
			storeOAuthState: jest.fn(),
			storePKCE: jest.fn(),
			loadOAuthInFlight: jest.fn(),
			loadOAuthSignIn: jest.fn(),
			storeOAuthSignIn: jest.fn(),
			loadOAuthState: jest.fn(),
			loadPKCE: jest.fn(),
			clearOAuthData: jest.fn(),
			clearOAuthInflightData: jest.fn(),
		} as OAuthStore,
	})
);

const mockHandleFailure = handleFailure as jest.Mock;
const mockValidateState = validateState as jest.Mock;
const mockResolveAndClearInflightPromises =
	resolveAndClearInflightPromises as jest.Mock;
const mockCacheCognitoTokens = cacheCognitoTokens as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockHubDispatch = Hub.dispatch as jest.Mock;
const mockDecodeJWT = decodeJWT as jest.Mock;

describe('completeOAuthFlow', () => {
	let windowSpy = jest.spyOn(window, 'window', 'get');
	const mockFetch = jest.fn();
	const mockReplaceState = jest.fn();

	beforeAll(() => {
		(global as any).fetch = mockFetch;
		windowSpy.mockImplementation(
			() =>
				({
					history: {
						replaceState: mockReplaceState,
					},
				}) as any
		);
	});

	afterEach(() => {
		mockHandleFailure.mockClear();
		mockResolveAndClearInflightPromises.mockClear();
		mockFetch.mockClear();
		mockReplaceState.mockClear();
		mockHubDispatch.mockClear();

		(oAuthStore.clearOAuthData as jest.Mock).mockClear();
		(oAuthStore.clearOAuthInflightData as jest.Mock).mockClear();
		(oAuthStore.clearOAuthData as jest.Mock).mockClear();
		(oAuthStore.storeOAuthSignIn as jest.Mock).mockClear();
	});

	it('handles error presented in the redirect url', async () => {
		const expectedErrorMessage = `some error message`;

		await completeOAuthFlow({
			currentUrl: `http://localhost:3000?error=true&error_description=${expectedErrorMessage}`,
			userAgentValue: 'UserAgent',
			clientId: 'clientId',
			redirectUri: 'http://localhost:3000/',
			responseType: 'code',
			domain: 'localhost:3000',
		});

		expect(mockResolveAndClearInflightPromises).toHaveBeenCalledTimes(1);
		expect(mockHandleFailure).toHaveBeenCalledWith(expectedErrorMessage);
	});

	describe('handleCodeFlow', () => {
		const testInput = {
			currentUrl: `http://localhost:3000?code=12345`,
			userAgentValue: 'UserAgent',
			clientId: 'clientId',
			redirectUri: 'http://localhost:3000/',
			responseType: 'code',
			domain: 'oauth.domain.com',
		};

		it('handles error when `validateState` fails', async () => {
			const expectedErrorMessage = 'some error';
			mockValidateState.mockImplementationOnce(() => {
				throw new AuthError({
					name: AuthErrorTypes.OAuthSignInError,
					message: expectedErrorMessage,
				});
			});

			await completeOAuthFlow(testInput);

			expect(mockHandleFailure).toHaveBeenCalledWith(expectedErrorMessage);
		});

		it('it terminate the inflight oauth process when `code` is not presented in the redirect url', async () => {
			await completeOAuthFlow({
				...testInput,
				currentUrl: `http://localhost:3000?`,
			});

			expect(oAuthStore.clearOAuthData).toHaveBeenCalledTimes(1);
			expect(mockResolveAndClearInflightPromises).toHaveBeenCalledTimes(1);
		});

		it('exchanges auth token and completes the oauth process', async () => {
			const expectedTokens = {
				access_token: 'access_token',
				id_token: 'id_token',
				refresh_token: 'refresh_token',
				token_type: 'token_type',
				expires_in: 'expires_in',
			};
			mockValidateState.mockReturnValueOnce('myState-valid_state');
			(oAuthStore.loadPKCE as jest.Mock).mockResolvedValueOnce('pkce23234a');
			const mockJsonMethod = jest.fn(() => Promise.resolve(expectedTokens));
			mockDecodeJWT.mockReturnValueOnce({
				payload: {
					username: 'testuser',
				},
			});
			mockFetch.mockResolvedValueOnce({
				json: mockJsonMethod,
			});

			await completeOAuthFlow(testInput);

			expect(mockFetch).toHaveBeenCalledWith(
				'https://oauth.domain.com/oauth2/token',
				expect.objectContaining({
					method: 'POST',
					body: 'grant_type=authorization_code&code=12345&client_id=clientId&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&code_verifier=pkce23234a',
				})
			);
			expect(mockCacheCognitoTokens).toHaveBeenLastCalledWith({
				username: 'testuser',
				AccessToken: expectedTokens.access_token,
				IdToken: expectedTokens.id_token,
				RefreshToken: expectedTokens.refresh_token,
				TokenType: expectedTokens.token_type,
				ExpiresIn: expectedTokens.expires_in,
			});
			expect(mockReplaceState).toHaveBeenCalledWith(
				{},
				'',
				testInput.redirectUri
			);

			expect(oAuthStore.clearOAuthData).toHaveBeenCalledTimes(1);
			expect(oAuthStore.storeOAuthSignIn).toHaveBeenCalledWith(true, undefined);

			expect(mockHubDispatch).toHaveBeenCalledTimes(3);
			expect(mockResolveAndClearInflightPromises).toHaveBeenCalledTimes(1);
		});

		it('invokes `handleFailure` when the `fetch` call resolves error', async () => {
			const mockError = {
				error: true,
				error_message: 'some error',
			};
			const mockJsonMethod = jest.fn(() => Promise.resolve(mockError));
			mockFetch.mockResolvedValueOnce({
				json: mockJsonMethod,
			});

			await completeOAuthFlow(testInput);

			expect(mockHandleFailure).toHaveBeenCalledWith(mockError.error_message);
		});
	});

	describe('handleImplicitFlow', () => {
		const testInput = {
			currentUrl: `http://localhost:3000#access_token=accessToken123`,
			userAgentValue: 'UserAgent',
			clientId: 'clientId',
			redirectUri: 'http://localhost:3000/',
			responseType: 'non-code',
			domain: 'oauth.domain.com',
		};

		it('terminates the inflight oauth process if access_token is not presented in the redirect url', async () => {
			const expectedErrorMessage = 'some error';
			await completeOAuthFlow({
				...testInput,
				currentUrl: `http://localhost:3000#`,
			});

			expect(oAuthStore.clearOAuthData).toHaveBeenCalledTimes(1);
			expect(mockResolveAndClearInflightPromises).toHaveBeenCalledTimes(1);
		});

		it('handles error when `validateState` fails', async () => {
			const expectedErrorMessage = 'some error';
			mockValidateState.mockImplementationOnce(() => {
				throw new AuthError({
					name: AuthErrorTypes.OAuthSignInError,
					message: expectedErrorMessage,
				});
			});

			await completeOAuthFlow(testInput);

			expect(mockHandleFailure).toHaveBeenCalledWith(expectedErrorMessage);
		});

		it('completes the inflight oauth flow', async () => {
			const expectedAccessToken = 'access_token';
			const expectedIdToken = 'id_token';
			const expectedTokenType = 'token_type';
			const expectedExpiresIn = 'expires_in';

			mockDecodeJWT.mockReturnValueOnce({
				payload: {
					username: 'testuser',
				},
			});

			await completeOAuthFlow({
				...testInput,
				currentUrl: `http://localhost:3000#access_token=${expectedAccessToken}&id_token=${expectedIdToken}&token_type=${expectedTokenType}&expires_in=${expectedExpiresIn}`,
			});

			expect(mockCacheCognitoTokens).toHaveBeenCalledWith({
				username: 'testuser',
				AccessToken: expectedAccessToken,
				IdToken: expectedIdToken,
				TokenType: expectedTokenType,
				ExpiresIn: expectedExpiresIn,
			});

			expect(mockReplaceState).toHaveBeenCalledWith(
				{},
				'',
				testInput.redirectUri
			);

			expect(oAuthStore.clearOAuthData).toHaveBeenCalledTimes(1);
			expect(oAuthStore.storeOAuthSignIn).toHaveBeenCalledWith(true, undefined);

			expect(mockHubDispatch).toHaveBeenCalledTimes(2);
			expect(mockResolveAndClearInflightPromises).toHaveBeenCalledTimes(1);
		});
	});
});
