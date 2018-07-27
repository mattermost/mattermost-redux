// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUserLocale} from 'selectors/entities/i18n';

import {sortFileInfos} from 'utils/file_utils';

function getAllFiles(state) {
    return state.entities.files.files;
}

function getFilesIdsForPost(state, postId) {
    if (postId) {
        return state.entities.files.fileIdsByPostId[postId] || [];
    }

    return [];
}

export function getFilePublicLink(state) {
    return state.entities.files.filePublicLink;
}

export function makeGetFilesForPost() {
    return createSelector(
        [getAllFiles, getFilesIdsForPost, getCurrentUserLocale],
        (allFiles, fileIdsForPost, locale) => {
            const fileInfos = fileIdsForPost.map((id) => allFiles[id]).filter((id) => Boolean(id));

            return sortFileInfos(fileInfos, locale);
        }
    );
}
