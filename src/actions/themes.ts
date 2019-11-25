// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThemeTypes} from 'action_types';
import {Client4} from 'client';

import {GetStateFunc, DispatchFunc} from 'types/actions';
import {Theme} from 'types/themes';

import {logError} from './errors';
import {forceLogoutIfNecessary} from './helpers';

export function receivedTheme(theme: Theme) {
    return {
        type: ThemeTypes.RECEIVED_THEME,
        theme,
    };
}

export function receivedThemes(themes: {[id: string]: Theme}) {
    return {
        type: ThemeTypes.RECEIVED_THEMES,
        themes,
    };
}

export function themeDeleted(id: string) {
    return {
        type: ThemeTypes.RECEIVED_THEME_DELETED,
        id,
    };
}

export function getAllThemes() {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let themes;

        try {
            themes = await Client4.getAllThemes();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedThemes(themes));

        return {data: themes};
    };
}

export function getTheme(id: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let theme;
        try {
            theme = await Client4.getTheme(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedTheme(theme));

        return {data: theme};
    };
}

export function saveTheme(theme: Theme) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let themes;

        try {
            themes = await Client4.saveTheme(theme);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedTheme(theme));

        return {data: themes};
    };
}

export function deleteTheme(id: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.deleteTheme(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(themeDeleted(id));

        return {data: true};
    };
}
