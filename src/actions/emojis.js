// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {Client4} from 'client';
import {EmojiTypes} from 'action_types';
import {General, Emoji} from 'constants';

import {getProfilesByIds} from 'actions/users';
import {getCustomEmojisByName as selectCustomEmojisByName} from 'selectors/entities/emojis';

import {parseNeededCustomEmojisFromText} from 'utils/emoji_utils';
import {isMinimumServerVersion} from 'utils/helpers';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

import type {GetStateFunc, DispatchFunc, ActionFunc} from 'types/actions';

export let systemEmojis: Map<string, Object> = new Map();

export function setSystemEmojis(emojis: Map<string, Object>) {
    systemEmojis = emojis;
}

export function createCustomEmoji(emoji: Object, image: Object): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.createCustomEmoji,
        onSuccess: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
        params: [
            emoji,
            image,
        ],
    });
}

export function getCustomEmoji(emojiId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getCustomEmoji,
        onSuccess: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
        params: [
            emojiId,
        ],
    });
}

export function getCustomEmojiByName(name: string): ActionFunc {
    return async (dispatch, getState) => {
        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7)) {
            return {data: {}};
        }

        let data;
        try {
            data = await Client4.getCustomEmojiByName(name);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            if (error.status_code === 404) {
                dispatch({type: EmojiTypes.CUSTOM_EMOJI_DOES_NOT_EXIST, data: name});
            } else {
                dispatch(logError(error));
            }

            return {error};
        }

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
            data,
        });

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

        return getCustomEmojisByName(Array.from(emojisToLoad))(dispatch, getState);
    };
}

export function getCustomEmojis(
    page: number = 0,
    perPage: number = General.PAGE_SIZE_DEFAULT,
    sort: string = Emoji.SORT_BY_NAME,
    loadUsers: boolean = false
): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await Client4.getCustomEmojis(page, perPage, sort);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        if (loadUsers) {
            dispatch(loadProfilesForCustomEmojis(data));
        }

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
            data,
        });

        return {data};
    };
}

export function loadProfilesForCustomEmojis(emojis: Array<Object>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const usersToLoad = {};
        emojis.forEach((emoji: Object) => {
            if (!getState().entities.users.profiles[emoji.creator_id]) {
                usersToLoad[emoji.creator_id] = true;
            }
        });

        const userIds = Object.keys(usersToLoad);

        if (userIds.length > 0) {
            await dispatch(getProfilesByIds(userIds));
        }

        return {data: true};
    };
}

export function getAllCustomEmojis(perPage: number = General.PAGE_SIZE_MAXIMUM): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({
            type: EmojiTypes.CLEAR_CUSTOM_EMOJIS,
            data: null,
        });

        let hasMore = true;
        let page = 0;
        const allEmojis = [];

        do {
            try {
                let emojis = [];
                emojis = await Client4.getCustomEmojis(page, perPage, Emoji.SORT_BY_NAME); // eslint-disable-line no-await-in-loop
                if (emojis.length < perPage) {
                    hasMore = false;
                } else {
                    page += 1;
                }
                allEmojis.push(...emojis);
            } catch (error) {
                forceLogoutIfNecessary(error, dispatch, getState);

                dispatch(logError(error));
                return {error: true};
            }
        } while (hasMore);

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
            data: allEmojis,
        });

        return {data: true};
    };
}

export function deleteCustomEmoji(emojiId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.deleteCustomEmoji(emojiId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: EmojiTypes.DELETED_CUSTOM_EMOJI,
            data: {id: emojiId},
        });

        return {data: true};
    };
}

export function searchCustomEmojis(term: string, options: Object = {}, loadUsers: boolean = false): ActionFunc {
    return async (dispatch, getState) => {
        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7)) {
            return {data: []};
        }

        let data;
        try {
            data = await Client4.searchCustomEmoji(term, options);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        if (loadUsers) {
            dispatch(loadProfilesForCustomEmojis(data));
        }

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
            data,
        });

        return {data};
    };
}

export function autocompleteCustomEmojis(name: string): ActionFunc {
    return async (dispatch, getState) => {
        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7)) {
            return {data: []};
        }

        let data;
        try {
            data = await Client4.autocompleteCustomEmoji(name);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
            data,
        });

        return {data};
    };
}
