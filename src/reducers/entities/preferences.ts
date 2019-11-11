// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {PreferenceTypes, UserTypes} from 'action_types';
import {GenericAction} from 'types/actions';
import {PreferenceType} from 'types/preferences';

function getKey(preference: PreferenceType) {
    return `${preference.category}--${preference.name}`;
}

function myPreferences(state: any = {}, action: GenericAction) {
    switch (action.type) {
    case PreferenceTypes.RECEIVED_ALL_PREFERENCES: {
        const nextState: any = {};

        if (action.data) {
            for (const preference of action.data) {
                nextState[getKey(preference)] = preference;
            }
        }

        return nextState;
    }

    case PreferenceTypes.RECEIVED_PREFERENCES: {
        const nextState = {...state};

        if (action.data) {
            for (const preference of action.data) {
                nextState[getKey(preference)] = preference;
            }
        }

        return nextState;
    }
    case PreferenceTypes.DELETED_PREFERENCES: {
        const nextState = {...state};

        if (action.data) {
            for (const preference of action.data) {
                Reflect.deleteProperty(nextState, getKey(preference));
            }
        }

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({

    // object where the key is the category-name and has the corresponding value
    myPreferences,
});
