// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { authErrorMessages } from '../../../../Errors';
import { AuthErrorCodes } from '../../../../common/AuthErrorStrings';
import { AuthError } from '../../../../errors/AuthError';

export const buildOauthError = (
	errorMessage: string,
	recoverySuggestion?: string
) => {
	return new AuthError({
		message: errorMessage ?? 'An error has occurred during the oauth process.',
		name: AuthErrorCodes.OAuthSignInError,
		recoverySuggestion:
			recoverySuggestion ?? authErrorMessages.oauthSignInError.log,
	});
};
