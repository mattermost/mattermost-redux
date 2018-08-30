// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {EmojiTypes} from 'action_types';
import {General, Emoji} from 'constants';

import {getProfilesByIds} from 'actions/users';
import {getCustomEmojisByName as selectCustomEmojisByName} from 'selectors/entities/emojis';

import {parseNeededCustomEmojisFromText} from 'utils/emoji_utils';
import {isMinimumServerVersion} from 'utils/helpers';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

import type {GetStateFunc, DispatchFunc, ActionFunc} from '../types/actions';

export let systemEmojis: Map<string, Object> = new Map();

export function setSystemEmojis(emojis: Map<string, Object>) {
    systemEmojis = emojis;
}

export function createCustomEmoji(emoji: Object, image: Object): ActionFunc {
    return bindClientFunc(
        Client4.createCustomEmoji,
        EmojiTypes.CREATE_CUSTOM_EMOJI_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJI, EmojiTypes.CREATE_CUSTOM_EMOJI_SUCCESS],
        EmojiTypes.CREATE_CUSTOM_EMOJI_FAILURE,
        emoji,
        image
    );
}

export function getCustomEmoji(emojiId: string): ActionFunc {
    return bindClientFunc(
        Client4.getCustomEmoji,
        EmojiTypes.GET_CUSTOM_EMOJI_REQUEST,
        [EmojiTypes.RECEIVED_CUSTOM_EMOJI, EmojiTypes.GET_CUSTOM_EMOJI_SUCCESS],
        EmojiTypes.GET_CUSTOM_EMOJI_FAILURE,
        emojiId
    );
}

export function getCustomEmojiByName(name: string): ActionFunc {
    return async (dispatch, getState) => {
        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7)) {
            return {data: {}};
        }

        dispatch({type: EmojiTypes.GET_CUSTOM_EMOJI_REQUEST, data: null}, getState);

        let data;
        try {
            data = await Client4.getCustomEmojiByName(name);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            const actions = [
                {type: EmojiTypes.GET_CUSTOM_EMOJI_FAILURE, error},
            ];

            if (error.status_code === 404) {
                actions.push({type: EmojiTypes.CUSTOM_EMOJI_DOES_NOT_EXIST, data: name});
            } else {
                dispatch(logError(error));
            }

            dispatch(batchActions(actions), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
                data,
            },
            {
                type: EmojiTypes.GET_CUSTOM_EMOJI_SUCCESS,
            },
        ]));

        return {data};
    };
}

export function getCustomEmojisByName(names: Array<string>): ActionFunc {
    return async (dispatch, getState) => {
        if (!names || names.length === 0) {
            return {data: true};
        }

        const promises = [];
        names.forEach((name) => promises.push(getCustomEmojiByName(name)(dispatch, getState)));

        await Promise.all(promises);
        return {data: true};
    };
}

export function getCustomEmojisInText(text: string): ActionFunc {
    return async (dispatch, getState) => {
        if (!text) {
            return {data: true};
        }

        const state = getState();
        const nonExistentEmoji = state.entities.emojis.nonExistentEmoji;
        const customEmojisByName = selectCustomEmojisByName(state);

        const emojisToLoad = parseNeededCustomEmojisFromText(text, systemEmojis, customEmojisByName, nonExistentEmoji);

        return await getCustomEmojisByName(Array.from(emojisToLoad))(dispatch, getState);
    };
}

export function getCustomEmojis(
    page: number = 0,
    perPage: number = General.PAGE_SIZE_DEFAULT,
    sort: string = Emoji.SORT_BY_NAME,
    loadUsers: boolean = false
): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST, data: {}}, getState);

        let data;
        try {
            data = await Client4.getCustomEmojis(page, perPage, sort);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        if (loadUsers) {
            const usersToLoad = {};
            Object.keys(data).forEach((key: string) => {
                const emoji = data[key];
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
                data,
            },
            {
                type: EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS,
                data: {},
            },
        ]));

        return {data};
    };
}

export function getAllCustomEmojis(perPage: number = General.PAGE_SIZE_MAXIMUM): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch(batchActions([
            {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_REQUEST},
            {type: EmojiTypes.CLEAR_CUSTOM_EMOJIS},
        ]), getState);

        let hasMore = true;
        let page = 0;
        const allEmojis = [];

        do {
            try {
                let emojis = [];
                emojis = await Client4.getCustomEmojis(page, perPage, Emoji.SORT_BY_NAME);
                if (emojis.length < perPage) {
                    hasMore = false;
                } else {
                    page += 1;
                }
                allEmojis.push(...emojis);
            } catch (error) {
                forceLogoutIfNecessary(error, dispatch, getState);

                dispatch(batchActions([
                    {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_FAILURE, error},
                    logError(error),
                ]), getState);
                return {error: true};
            }
        } while (hasMore);

        dispatch(batchActions([
            {type: EmojiTypes.GET_ALL_CUSTOM_EMOJIS_SUCCESS},
            {
                type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
                data: allEmojis,
            },
        ]), getState);

        return {data: true};
    };
}

export function deleteCustomEmoji(emojiId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: EmojiTypes.DELETE_CUSTOM_EMOJI_REQUEST, data: {}}, getState);

        try {
            await Client4.deleteCustomEmoji(emojiId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: EmojiTypes.DELETE_CUSTOM_EMOJI_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: EmojiTypes.DELETED_CUSTOM_EMOJI,
                data: {id: emojiId},
            },
            {
                type: EmojiTypes.DELETE_CUSTOM_EMOJI_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function searchCustomEmojis(term: string, options: Object = {}): ActionFunc {
    return async (dispatch, getState) => {
        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7)) {
            return {data: []};
        }

        dispatch({type: EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST, data: null}, getState);

        let data;
        try {
            data = await Client4.searchCustomEmoji(term, options);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
                data,
            },
            {
                type: EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS,
            },
        ]), getState);

        return {data};
    };
}

export function autocompleteCustomEmojis(name: string): ActionFunc {
    return async (dispatch, getState) => {
        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7)) {
            return {data: []};
        }

        dispatch({type: EmojiTypes.GET_CUSTOM_EMOJIS_REQUEST, data: null}, getState);

        let data;
        try {
            data = await Client4.autocompleteCustomEmoji(name);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: EmojiTypes.GET_CUSTOM_EMOJIS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
                data,
            },
            {
                type: EmojiTypes.GET_CUSTOM_EMOJIS_SUCCESS,
            },
        ]), getState);

        return {data};
    };
}
