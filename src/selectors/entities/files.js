// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

function getAllFiles(state) {
    return state.entities.files.files;
}

function getFilesIdsForPost(state, post) {
    if (post.hasOwnProperty('id')) {
        return state.entities.files.fileIdsByPostId[post.id] || [];
    }

    return [];
}

export function makeGetFilesForPost() {
    return createSelector(
        [getAllFiles, getFilesIdsForPost],
        (allFiles, fileIdsForPost) => {
            return fileIdsForPost.map((id) => allFiles[id]);
        }
    );
}
