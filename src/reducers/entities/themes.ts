// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ThemeTypes, UserTypes} from 'action_types';

import {GenericAction} from 'types/actions';
import {Theme} from 'types/themes';

function themes(state: {[name: string]: Theme} = {}, action: GenericAction) {
    switch (action.type) {
    case ThemeTypes.RECEIVED_THEME:
        return {
            ...state,
            [action.name]: action.theme,
        };
    case ThemeTypes.RECEIVED_THEMES: {
        const nextState = {...state};

        for (const [name, theme] of Object.entries(action.themes)) {
            nextState[name] = theme as Theme;
        }

        return nextState;
    }
    case ThemeTypes.RECEIVED_THEME_DELETED: {
        const nextState = {...state};

        Reflect.deleteProperty(nextState, action.name);

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({
    themes,
});
