// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CognitoUserPoolConfig } from '@aws-amplify/core';

import { OpenAuthSessionResult } from '../../../../utils/types';
import { DefaultOAuthStore } from '../../utils/signInWithRedirectStore';
import { TokenOrchestrator } from '../../tokenProvider';

import { completeOAuthSignOut } from './completeOAuthSignOut';
import { oAuthSignOutRedirect } from './oAuthSignOutRedirect';

export const handleOAuthSignOut = async (
	cognitoConfig: CognitoUserPoolConfig,
	store: DefaultOAuthStore,
	// To match the web counter part of the function.
	tokenOrchestrator: TokenOrchestrator,
	preferredSignOutUrl?: string,
): Promise<void | OpenAuthSessionResult> => {
	const { isOAuthSignIn, preferPrivateSession } = await store.loadOAuthSignIn();
	if (isOAuthSignIn) {
		const result = await oAuthSignOutRedirect(
			cognitoConfig,
			preferPrivateSession,
			preferredSignOutUrl,
		);
		// If this was a private session, clear data and tokens regardless of what happened with logout
		// endpoint. Otherwise, only do so if the logout endpoint was succesfully visited.
		const shouldCompleteSignOut =
			preferPrivateSession || result?.type === 'success';
		if (shouldCompleteSignOut) {
			await completeOAuthSignOut(store);
		}

		return result;
	}

	return completeOAuthSignOut(store);
};
