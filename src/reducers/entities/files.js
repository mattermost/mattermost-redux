// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {FileTypes, PostTypes, UserTypes} from 'action_types';

export function files(state = {}, action) {
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

    case PostTypes.RECEIVED_NEW_POST:
    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        return storeFilesForPost(state, post);
    }

    case PostTypes.RECEIVED_POSTS: {
        const posts = Object.values(action.data.posts);

        return posts.reduce(storeFilesForPost, state);
    }

    case PostTypes.POST_DELETED:
    case PostTypes.POST_REMOVED: {
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

function storeFilesForPost(state, post) {
    if (!post.metadata || !post.metadata.files) {
        return state;
    }

    return post.metadata.files.reduce((nextState, file) => {
        if (nextState[file.id]) {
            // File is already in the store
            return nextState;
        }

        return {
            ...nextState,
            [file.id]: file,
        };
    }, state);
}

export function fileIdsByPostId(state = {}, action) {
    switch (action.type) {
    case FileTypes.RECEIVED_FILES_FOR_POST: {
        const {data, postId} = action;
        const filesIdsForPost = data.map((file) => file.id);
        return {...state,
            [postId]: filesIdsForPost,
        };
    }

    case PostTypes.RECEIVED_NEW_POST:
    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        return storeFilesIdsForPost(state, post);
    }

    case PostTypes.RECEIVED_POSTS: {
        const posts = Object.values(action.data.posts);

        return posts.reduce(storeFilesIdsForPost, state);
    }

    case PostTypes.POST_DELETED:
    case PostTypes.POST_REMOVED: {
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

function storeFilesIdsForPost(state, post) {
    if (!post.metadata || !post.metadata.files) {
        return state;
    }

    return {
        ...state,
        [post.id]: post.metadata.files ? post.metadata.files.map((file) => file.id) : [],
    };
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
