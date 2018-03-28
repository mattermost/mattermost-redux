// Copyright (c) 2018-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as FileUtils from 'utils/file_utils';

describe('FileUtils', () => {
    it('getFileUrl', () => {
        assert.deepEqual(FileUtils.getFileUrl('id1'), '/api/v4/files/id1');
        assert.deepEqual(FileUtils.getFileUrl('id2'), '/api/v4/files/id2');
    });

    it('getFileDownloadUrl', () => {
        assert.deepEqual(FileUtils.getFileDownloadUrl('id1'), '/api/v4/files/id1?download=1');
        assert.deepEqual(FileUtils.getFileDownloadUrl('id2'), '/api/v4/files/id2?download=1');
    });

    it('getFileThumbnailUrl', () => {
        assert.deepEqual(FileUtils.getFileThumbnailUrl('id1'), '/api/v4/files/id1/thumbnail');
        assert.deepEqual(FileUtils.getFileThumbnailUrl('id2'), '/api/v4/files/id2/thumbnail');
    });

    it('getFilePreviewUrl', () => {
        assert.deepEqual(FileUtils.getFilePreviewUrl('id1'), '/api/v4/files/id1/preview');
        assert.deepEqual(FileUtils.getFilePreviewUrl('id2'), '/api/v4/files/id2/preview');
    });
});
