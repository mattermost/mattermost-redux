// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {EmojiTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function createCustomEmoji(state = initialRequestState(), action) {
    return handleRequest(
        EmojiTypes.CREATE_CUSTOM_EMOJI_REQUEST,
        EmojiTypes.CREATE_CUSTOM_EMOJI_SUCCESS,
        EmojiTypes.CREATE_CUSTOM_EMOJI_FAILURE,
        state,
        action
    );
}

function getCustomEmoji(state = initialRequestState(), action) {
    return handleRequest(
        EmojiTypes.GET_CUSTOM_EMOJI_REQUEST,
        EmojiTypes.GET_CUSTOM_EMOJI_SUCCESS,
        EmojiTypes.GET_CUSTOM_EMOJI_FAILURE,
        state,
        action
    );
}

function getCustomEmojis(state = initialRequestState(), action) {
    return handleRequest(
        EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST,
        EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS,
        EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE,
        state,
        action
    );
}

function getAllCustomEmojis(state = initialRequestState(), action) {
    return handleRequest(
        EmojiTypes.GET_ALL_CUSTOM_EMOJIS_REQUEST,
        EmojiTypes.GET_ALL_CUSTOM_EMOJIS_SUCCESS,
        EmojiTypes.GET_ALL_CUSTOM_EMOJIS_FAILURE,
        state,
        action
    );
}

function deleteCustomEmoji(state = initialRequestState(), action) {
    return handleRequest(
        EmojiTypes.DELETE_CUSTOM_EMOJI_REQUEST,
        EmojiTypes.DELETE_CUSTOM_EMOJI_SUCCESS,
        EmojiTypes.DELETE_CUSTOM_EMOJI_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    createCustomEmoji,
    getCustomEmoji,
    getCustomEmojis,
    getAllCustomEmojis,
    deleteCustomEmoji
});

