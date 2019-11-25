// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ThemeTypes, UserTypes} from 'action_types';

import {GenericAction} from 'types/actions';
import {Theme} from 'types/themes';

function themes(state: {[id: string]: Theme} = {}, action: GenericAction) {
    switch (action.type) {
    case ThemeTypes.RECEIVED_THEME:
        return {
            ...state,
            [action.theme.id]: action.theme,
        };
    case ThemeTypes.RECEIVED_THEMES: {
        const nextState = {...state};

        for (const theme of action.themes) {
            nextState[theme.id] = theme as Theme;
        }

        return nextState;
    }
    case ThemeTypes.RECEIVED_THEME_DELETED: {
        const nextState = {...state};

        Reflect.deleteProperty(nextState, action.id);

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
