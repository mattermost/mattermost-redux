// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {EmojiTypes} from 'action_types';
import {General, Emoji} from 'constants';
import {batchActions} from 'redux-batched-actions';

import {Client, Client4} from 'client';

import {getProfilesByIds} from 'actions/users';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

export function createCustomEmoji(emoji, image) {
    return bindClientFunc(
        Client4.createCustomEmoji,
        EmojiTypes.CREATE_CUSTOM_EMOJI_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJI, EmojiTypes.CREATE_CUSTOM_EMOJI_SUCCESS],
        EmojiTypes.CREATE_CUSTOM_EMOJI_FAILURE,
        emoji,
        image
    );
}

export function getCustomEmoji(emojiId) {
    return bindClientFunc(
        Client4.getCustomEmoji,
        EmojiTypes.GET_CUSTOM_EMOJI_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJI, EmojiTypes.GET_CUSTOM_EMOJI_SUCCESS],
        EmojiTypes.GET_CUSTOM_EMOJI_FAILURE,
        emojiId
    );
}

export function getCustomEmojiByName(name) {
    return bindClientFunc(
        Client4.getCustomEmojiByName,
        EmojiTypes.GET_CUSTOM_EMOJI_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJI, EmojiTypes.GET_CUSTOM_EMOJI_SUCCESS],
        EmojiTypes.GET_CUSTOM_EMOJI_FAILURE,
        name
    );
}

export function getCustomEmojis(page = 0, perPage = General.PAGE_SIZE_DEFAULT, sort = Emoji.SORT_BY_NAME, loadUsers = false) {
    return async (dispatch, getState) => {
        dispatch({type: EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST}, getState);

        let data;
        try {
            data = await Client4.getCustomEmojis(page, perPage, sort);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        if (loadUsers) {
            const usersToLoad = {};
            Object.values(data).forEach((emoji) => {
                if (!getState().entities.users.profiles[emoji.creator_id]) {
                    usersToLoad[emoji.creator_id] = true;
                }
            });

            const userIds = Object.keys(usersToLoad);

            if (userIds.length > 0) {
                getProfilesByIds(userIds)(dispatch, getState);
            }
        }

        dispatch(batchActions([
            {
                type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
                data
            },
            {
                type: EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS
            }
        ]));

        return {data};
    };
}

export function getAllCustomEmojis(perPage = General.PAGE_SIZE_MAXIMUM) {
    return async (dispatch, getState) => {
        dispatch(batchActions([
            {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_REQUEST},
            {type: EmojiTypes.CLEAR_CUSTOM_EMOJIS}
        ]), getState);

        let hasMore = true;
        let page = 0;
        const allEmojis = [];

        const serverVersion = getState().entities.general.serverVersion;

        do {
            try {
                let emojis = [];
                if (serverVersion.charAt(0) === '3') {
                    emojis = await Client.getCustomEmojis();
                    hasMore = false;
                } else {
                    emojis = await Client4.getCustomEmojis(page, perPage, Emoji.SORT_BY_NAME);
                    if (emojis.length < perPage) {
                        hasMore = false;
                    } else {
                        page += 1;
                    }
                    allEmojis.push(...emojis);
                }
            } catch (error) {
                forceLogoutIfNecessary(error, dispatch, getState);

                return dispatch(batchActions([
                    {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_FAILURE, error},
                    logError(error)(dispatch)
                ]), getState);
            }
        } while (hasMore);

        dispatch(batchActions([
            {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_SUCCESS},
            {
                type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
                data: allEmojis
            }
        ]), getState);

        return {data: true};
    };
}

export function deleteCustomEmoji(emojiId) {
    return async (dispatch, getState) => {
        dispatch({type: EmojiTypes.DELETE_CUSTOM_EMOJI_REQUEST}, getState);

        try {
            await Client4.deleteCustomEmoji(emojiId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: EmojiTypes.DELETE_CUSTOM_EMOJI_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: EmojiTypes.DELETED_CUSTOM_EMOJI,
                data: {id: emojiId}
            },
            {
                type: EmojiTypes.DELETE_CUSTOM_EMOJI_SUCCESS
            }
        ]), getState);

        return {data: true};
    };
}

export function searchCustomEmojis(term, options = {}) {
    return bindClientFunc(
        Client4.searchCustomEmoji,
        EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJIS, EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS],
        EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE,
        term,
        options
    );
}

export function autocompleteCustomEmojis(name) {
    return bindClientFunc(
        Client4.autocompleteCustomEmoji,
        EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJIS, EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS],
        EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE,
        name
    );
}
