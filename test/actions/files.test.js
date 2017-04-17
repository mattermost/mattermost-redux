// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import fs from 'fs';
import assert from 'assert';

import * as Actions from 'actions/files';
import {Client, Client4} from 'client';
import configureStore from 'store';
import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';

const FormData = require('form-data');

describe('Actions.Files', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(() => {
        store = configureStore();
    });

    after(async () => {
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('uploadFile', async () => {
        const {basicChannel} = TestHelper;
        const testFileName = 'test.png';
        const testImageData = fs.createReadStream(`test/assets/images/${testFileName}`);
        const clientId = TestHelper.generateId();

        const imageFormData = new FormData();
        imageFormData.append('files', testImageData);
        imageFormData.append('channel_id', basicChannel.id);
        imageFormData.append('client_ids', clientId);
        const formBoundary = imageFormData.getBoundary();

        await Actions.uploadFile(basicChannel.id, null, imageFormData, formBoundary)(store.dispatch, store.getState);

        const state = store.getState();
        const uploadRequest = state.requests.files.uploadFiles;
        if (uploadRequest.status === RequestStatus.FAILURE) {
            throw uploadRequest.error;
        }

        const files = state.entities.files.files;
        const file = Object.keys(files).find((f) => files[f].name === testFileName);
        assert.ok(file, 'Could not find uploaded file.');
    });

    it('getFilesForPost', async () => {
        const {basicClient4, basicChannel} = TestHelper;
        const testFileName = 'test.png';
        const testImageData = fs.createReadStream(`test/assets/images/${testFileName}`);
        const clientId = TestHelper.generateId();

        const imageFormData = new FormData();
        imageFormData.append('files', testImageData);
        imageFormData.append('channel_id', basicChannel.id);
        imageFormData.append('client_ids', clientId);
        const formBoundary = imageFormData.getBoundary();

        const fileUploadResp = await basicClient4.
            uploadFile(imageFormData, formBoundary);
        const fileId = fileUploadResp.file_infos[0].id;

        const fakePostForFile = TestHelper.fakePost(basicChannel.id);
        fakePostForFile.file_ids = [fileId];
        const postForFile = await basicClient4.createPost(fakePostForFile);

        await Actions.getFilesForPost(postForFile.id)(store.dispatch, store.getState);

        const filesRequest = store.getState().requests.files.getFilesForPost;
        const {files: allFiles, fileIdsByPostId} = store.getState().entities.files;

        if (filesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(filesRequest.error));
        }

        assert.ok(allFiles);
        assert.ok(allFiles[fileId]);
        assert.equal(allFiles[fileId].id, fileId);
        assert.equal(allFiles[fileId].name, testFileName);

        assert.ok(fileIdsByPostId);
        assert.ok(fileIdsByPostId[postForFile.id]);
        assert.equal(fileIdsByPostId[postForFile.id][0], fileId);
    });
});
