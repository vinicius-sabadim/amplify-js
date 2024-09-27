// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// TODO(ashwinkumar6): remove duplicate storage/src/providers/s3/utils/client/runtime/s3TransferHandler/fetch.ts
import {
	HttpRequest,
	HttpResponse,
	authenticatedHandler,
} from '@aws-amplify/core/internals/aws-client-utils';
import { composeTransferHandler } from '@aws-amplify/core/internals/aws-client-utils/composers';

import { contentSha256MiddlewareFactory } from '../contentSha256middleware';

import type { s3TransferHandler as s3WebTransferHandler } from './xhr';

/**
 * S3 transfer handler for node based on Node-fetch. On top of basic transfer handler, it also supports
 * x-amz-content-sha256 header. However, it does not support request&response process tracking like browser.
 *
 * @internal
 */
export const s3TransferHandler: typeof s3WebTransferHandler =
	composeTransferHandler<
		[object],
		HttpRequest,
		HttpResponse,
		typeof authenticatedHandler
	>(authenticatedHandler, [contentSha256MiddlewareFactory]);
