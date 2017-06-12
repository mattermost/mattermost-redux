// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {EmojiTypes} from 'action_types';
import {General} from 'constants';
import {batchActions} from 'redux-batched-actions';

import {Client} from 'client';

import {getLogErrorAction} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

export function createCustomEmoji(emoji, image) {
    return bindClientFunc(
        Client.createCustomEmoji,
        EmojiTypes.CREATE_CUSTOM_EMOJI_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJI, EmojiTypes.CREATE_CUSTOM_EMOJI_SUCCESS],
        EmojiTypes.CREATE_CUSTOM_EMOJI_FAILURE,
        emoji,
        image
    );
}

// page and perPage to be used when converting to v4
export function getCustomEmojis(page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client.getCustomEmojis,
        EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJIS, EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS],
        EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE,
        page,
        perPage
    );
}

export function getAllCustomEmojis(perPage = General.PAGE_SIZE_DEFAULT) {
    return async (dispatch, getState) => {
        dispatch(batchActions([
            {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_REQUEST},
            {type: EmojiTypes.CLEAR_CUSTOM_EMOJIS}
        ]), getState);

        // hasMore should be set to true once we switch to v4
        let hasMore = false;
        let page = 0;

        do {
            try {
                const emojis = await Client.getCustomEmojis(page, perPage);

                dispatch({
                    type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
                    data: emojis
                });

                if (emojis.length < perPage) {
                    hasMore = false;
                } else {
                    page += 1;
                }
            } catch (error) {
                forceLogoutIfNecessary(error, dispatch);

                return dispatch(batchActions([
                    {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_FAILURE, error},
                    getLogErrorAction(error)
                ]), getState);
            }
        } while (hasMore);

        return dispatch({type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_SUCCESS}, getState);
    };
}

export function deleteCustomEmoji(emojiId) {
    return async (dispatch, getState) => {
        dispatch({type: EmojiTypes.DELETE_CUSTOM_EMOJI_REQUEST}, getState);

        try {
            await Client.deleteCustomEmoji(emojiId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: EmojiTypes.DELETE_CUSTOM_EMOJI_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return true;
    };
}
