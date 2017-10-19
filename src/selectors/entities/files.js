// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

function getAllFiles(state) {
    return state.entities.files.files;
}

function getFilesIdsForPost(state, postId) {
    if (postId) {
        return state.entities.files.fileIdsByPostId[postId] || [];
    }

    return [];
}

export function makeGetFilesForPost() {
    return createSelector(
        [getAllFiles, getFilesIdsForPost],
        (allFiles, fileIdsForPost) => {
            return fileIdsForPost.map((id) => allFiles[id]).filter((id) => Boolean(id));
        }
    );
}
