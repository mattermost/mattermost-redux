// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {FileTypes, PostTypes, UserTypes} from 'action_types';

function files(state = {}, action) {
    switch (action.type) {
    case FileTypes.RECEIVED_UPLOAD_FILES:
    case FileTypes.RECEIVED_FILES_FOR_POST: {
        const filesById = action.data.reduce((filesMap, file) => {
            return {...filesMap,
                [file.id]: file,
            };
        }, {});
        return {...state,
            ...filesById,
        };
    }

    case PostTypes.POST_DELETED: {
        if (action.data && action.data.file_ids && action.data.file_ids.length) {
            const nextState = {...state};
            const fileIds = action.data.file_ids;
            fileIds.forEach((id) => {
                Reflect.deleteProperty(nextState, id);
            });

            return nextState;
        }

        return state;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function fileIdsByPostId(state = {}, action) {
    switch (action.type) {
    case FileTypes.RECEIVED_FILES_FOR_POST: {
        const {data, postId} = action;
        const filesIdsForPost = data.map((file) => file.id);
        return {...state,
            [postId]: filesIdsForPost,
        };
    }

    case PostTypes.POST_DELETED: {
        if (action.data) {
            const nextState = {...state};
            Reflect.deleteProperty(nextState, action.data.id);
            return nextState;
        }

        return state;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function filePublicLink(state = {}, action) {
    switch (action.type) {
    case FileTypes.RECEIVED_FILE_PUBLIC_LINK: {
        return action.data;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return '';

    default:
        return state;
    }
}

export default combineReducers({
    files,
    fileIdsByPostId,
    filePublicLink,
});
