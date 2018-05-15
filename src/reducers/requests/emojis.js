// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {EmojiTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType} from '../../types/requests';

function createCustomEmoji(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        EmojiTypes.CREATE_CUSTOM_EMOJI_REQUEST,
        EmojiTypes.CREATE_CUSTOM_EMOJI_SUCCESS,
        EmojiTypes.CREATE_CUSTOM_EMOJI_FAILURE,
        state,
        action
    );
}

function getCustomEmoji(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        EmojiTypes.GET_CUSTOM_EMOJI_REQUEST,
        EmojiTypes.GET_CUSTOM_EMOJI_SUCCESS,
        EmojiTypes.GET_CUSTOM_EMOJI_FAILURE,
        state,
        action
    );
}

function getCustomEmojis(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST,
        EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS,
        EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE,
        state,
        action
    );
}

function getAllCustomEmojis(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        EmojiTypes.GET_ALL_CUSTOM_EMOJIS_REQUEST,
        EmojiTypes.GET_ALL_CUSTOM_EMOJIS_SUCCESS,
        EmojiTypes.GET_ALL_CUSTOM_EMOJIS_FAILURE,
        state,
        action
    );
}

function deleteCustomEmoji(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
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
    deleteCustomEmoji,
});
