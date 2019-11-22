// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThemeTypes} from 'action_types';
import {Client4} from 'client';

import {GetStateFunc, DispatchFunc} from 'types/actions';
import {Theme} from 'types/themes';

import {logError} from './errors';
import {forceLogoutIfNecessary} from './helpers';

export function receivedTheme(name: string, theme: Theme) {
    return {
        type: ThemeTypes.RECEIVED_THEME,
        name,
        theme,
    };
}

export function receivedThemes(themes: {[name: string]: Theme}) {
    return {
        type: ThemeTypes.RECEIVED_THEMES,
        themes,
    };
}

export function themeDeleted(name: string) {
    return {
        type: ThemeTypes.RECEIVED_THEME_DELETED,
        name,
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

export function getThemeByName(name: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let theme;
        try {
            theme = await Client4.getThemeByName(name);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedTheme(name, theme));

        return {data: theme};
    };
}

export function saveTheme(name: string, theme: Theme) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let themes;

        try {
            themes = await Client4.saveTheme(name, theme);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedTheme(name, theme));

        return {data: themes};
    };
}

export function deleteTheme(name: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.deleteTheme(name);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(themeDeleted(name));

        return {data: true};
    };
}
