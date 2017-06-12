// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {EmojiTypes, UserTypes} from 'action_types';

function customEmoji(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case EmojiTypes.RECEIVED_CUSTOM_EMOJI: {
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJIS: {
        for (const emoji of action.data) {
            nextState[emoji.id] = emoji;
        }
        return nextState;
    }
    case EmojiTypes.DELETED_CUSTOM_EMOJI: {
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    }
    case EmojiTypes.CLEAR_CUSTOM_EMOJIS:
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

export default combineReducers({

    // object where every key is the custom emoji id and has an object with the custom emoji details
    customEmoji

});
