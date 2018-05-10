// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';
import {Client4} from 'client';

import * as FileUtils from 'utils/file_utils';

describe('FileUtils', () => {
    const serverUrl = Client4.getUrl();
    beforeEach(() => {
        Client4.setUrl('localhost');
    });

    afterEach(() => {
        Client4.setUrl(serverUrl);
    });

    it('getFileUrl', () => {
        assert.deepEqual(FileUtils.getFileUrl('id1'), 'localhost/api/v4/files/id1');
        assert.deepEqual(FileUtils.getFileUrl('id2'), 'localhost/api/v4/files/id2');
    });

    it('getFileDownloadUrl', () => {
        assert.deepEqual(FileUtils.getFileDownloadUrl('id1'), 'localhost/api/v4/files/id1?download=1');
        assert.deepEqual(FileUtils.getFileDownloadUrl('id2'), 'localhost/api/v4/files/id2?download=1');
    });

    it('getFileThumbnailUrl', () => {
        assert.deepEqual(FileUtils.getFileThumbnailUrl('id1'), 'localhost/api/v4/files/id1/thumbnail');
        assert.deepEqual(FileUtils.getFileThumbnailUrl('id2'), 'localhost/api/v4/files/id2/thumbnail');
    });

    it('getFilePreviewUrl', () => {
        assert.deepEqual(FileUtils.getFilePreviewUrl('id1'), 'localhost/api/v4/files/id1/preview');
        assert.deepEqual(FileUtils.getFilePreviewUrl('id2'), 'localhost/api/v4/files/id2/preview');
    });
});
