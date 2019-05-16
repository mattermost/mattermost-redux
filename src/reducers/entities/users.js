// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {UserTypes, ChannelTypes} from 'action_types';
import {profileListToMap} from 'utils/user_utils';

function profilesToSet(state, action) {
    const id = action.id;
    const nextSet = new Set(state[id]);
    Object.keys(action.data).forEach((key) => {
        nextSet.add(key);
    });

    return {
        ...state,
        [id]: nextSet,
    };
}

function profileListToSet(state, action, replace = false) {
    const id = action.id;
    const nextSet = replace ? new Set() : new Set(state[id]);
    if (action.data) {
        action.data.forEach((profile) => {
            nextSet.add(profile.id);
        });

        return {
            ...state,
            [id]: nextSet,
        };
    }

    return state;
}

function removeProfileListFromSet(state, action) {
    const id = action.id;
    const nextSet = new Set(state[id]);
    if (action.data) {
        action.data.forEach((profile) => {
            nextSet.delete(profile.id);
        });

        return {
            ...state,
            [id]: nextSet,
        };
    }

    return state;
}

function addProfileToSet(state, action) {
    const {id, user_id: userId} = action.data;
    const nextSet = new Set(state[id]);
    nextSet.add(userId);
    return {
        ...state,
        [id]: nextSet,
    };
}

function removeProfileFromSet(state, action) {
    const {id, user_id: userId} = action.data;
    const nextSet = new Set(state[id]);
    nextSet.delete(userId);
    return {
        ...state,
        [id]: nextSet,
    };
}

function currentUserId(state = '', action) {
    switch (action.type) {
    case UserTypes.RECEIVED_ME: {
        const data = action.data || action.payload;

        return data.id;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return '';
    }

    return state;
}

function mySessions(state = [], action) {
    switch (action.type) {
    case UserTypes.RECEIVED_SESSIONS:
        return [...action.data];

    case UserTypes.RECEIVED_REVOKED_SESSION: {
        let index = -1;
        const length = state.length;
        for (let i = 0; i < length; i++) {
            if (state[i].id === action.sessionId) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            return state.slice(0, index).concat(state.slice(index + 1));
        }

        return state;
    }

    case UserTypes.REVOKE_ALL_USER_SESSIONS_SUCCESS:
        if (action.data.isCurrentUser === true) {
            return [];
        }
        return state;

    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function myAudits(state = [], action) {
    switch (action.type) {
    case UserTypes.RECEIVED_AUDITS:
        return [...action.data];

    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function profiles(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_ME:
    case UserTypes.RECEIVED_PROFILE: {
        const data = action.data || action.payload;
        const user = {...data};
        const oldUser = state[data.id];
        if (oldUser) {
            user.terms_of_service_id = oldUser.terms_of_service_id;
            user.terms_of_service_create_at = oldUser.terms_of_service_create_at;
        }

        return {
            ...state,
            [data.id]: user,
        };
    }
    case UserTypes.RECEIVED_PROFILES_LIST:
        return Object.assign({}, state, profileListToMap(action.data));
    case UserTypes.RECEIVED_PROFILES:
        return Object.assign({}, state, action.data);

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    case UserTypes.RECEIVED_TERMS_OF_SERVICE_STATUS: {
        const data = action.data || action.payload;
        return {
            ...state,
            [data.user_id]: {
                ...state[data.user_id],
                terms_of_service_id: data.terms_of_service_id,
                terms_of_service_create_at: data.terms_of_service_create_at,
            },
        };
    }

    default:
        return state;
    }
}

function profilesInTeam(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_IN_TEAM:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_IN_TEAM:
        return profilesToSet(state, action);

    case UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM:
        return removeProfileFromSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM:
        return removeProfileListFromSet(state, action);

    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function profilesNotInTeam(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM_AND_REPLACE:
        return profileListToSet(state, action, true);

    case UserTypes.RECEIVED_PROFILE_IN_TEAM:
        return removeProfileFromSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM:
        return removeProfileListFromSet(state, action);

    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function profilesWithoutTeam(state = new Set(), action) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_WITHOUT_TEAM: {
        const nextSet = new Set(state);
        Object.values(action.data).forEach((id) => nextSet.add(id));
        return nextSet;
    }
    case UserTypes.RECEIVED_PROFILES_LIST_WITHOUT_TEAM: {
        const nextSet = new Set(state);
        action.data.forEach((user) => nextSet.add(user.id));
        return nextSet;
    }
    case UserTypes.RECEIVED_PROFILE_IN_TEAM: {
        const nextSet = new Set(state);
        nextSet.delete(action.data.id);
        return nextSet;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return new Set();

    default:
        return state;
    }
}

function profilesInChannel(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_IN_CHANNEL:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_IN_CHANNEL:
        return profilesToSet(state, action);

    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL:
        return removeProfileFromSet(state, action);

    case ChannelTypes.CHANNEL_MEMBER_REMOVED:
        return removeProfileFromSet(state, {data: {
            id: action.data.channel_id,
            user_id: action.data.user_id,
        }});

    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function profilesNotInChannel(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL_AND_REPLACE:
        return profileListToSet(state, action, true);

    case UserTypes.RECEIVED_PROFILES_NOT_IN_CHANNEL:
        return profilesToSet(state, action);

    case UserTypes.RECEIVED_PROFILE_IN_CHANNEL:
        return removeProfileFromSet(state, action);

    case ChannelTypes.CHANNEL_MEMBER_ADDED:
        return removeProfileFromSet(state, {data: {
            id: action.data.channel_id,
            user_id: action.data.user_id,
        }});

    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function statuses(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_STATUS: {
        const nextState = Object.assign({}, state);
        nextState[action.data.user_id] = action.data.status;

        return nextState;
    }
    case UserTypes.RECEIVED_STATUSES: {
        const nextState = Object.assign({}, state);

        for (const s of action.data) {
            nextState[s.user_id] = s.status;
        }

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function myUserAccessTokens(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_MY_USER_ACCESS_TOKEN: {
        const nextState = {...state};
        nextState[action.data.id] = action.data;

        return nextState;
    }
    case UserTypes.RECEIVED_MY_USER_ACCESS_TOKENS: {
        const nextState = {...state};

        for (const uat of action.data) {
            nextState[uat.id] = uat;
        }

        return nextState;
    }
    case UserTypes.REVOKED_USER_ACCESS_TOKEN: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data);

        return nextState;
    }

    case UserTypes.ENABLED_USER_ACCESS_TOKEN: {
        if (state[action.data]) {
            const nextState = {...state};
            nextState[action.data] = {...nextState[action.data], is_active: true};
            return nextState;
        }
        return state;
    }

    case UserTypes.DISABLED_USER_ACCESS_TOKEN: {
        if (state[action.data]) {
            const nextState = {...state};
            nextState[action.data] = {...nextState[action.data], is_active: false};
            return nextState;
        }
        return state;
    }

    case UserTypes.CLEAR_MY_USER_ACCESS_TOKENS:
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function stats(state = {}, action) {
    switch (action.type) {
    case UserTypes.RECEIVED_USER_STATS: {
        const stat = action.data;
        return {
            ...state,
            ...stat,
        };
    }
    default:
        return state;
    }
}

export default combineReducers({

    // the current selected user
    currentUserId,

    // array with the user's sessions
    mySessions,

    // array with the user's audits
    myAudits,

    // object where every key is the token id and has a user access token as a value
    myUserAccessTokens,

    // object where every key is a user id and has an object with the users details
    profiles,

    // object where every key is a team id and has a Set with the users id that are members of the team
    profilesInTeam,

    // object where every key is a team id and has a Set with the users id that are not members of the team
    profilesNotInTeam,

    // set with user ids for users that are not on any team
    profilesWithoutTeam,

    // object where every key is a channel id and has a Set with the users id that are members of the channel
    profilesInChannel,

    // object where every key is a channel id and has a Set with the users id that are not members of the channel
    profilesNotInChannel,

    // object where every key is the user id and has a value with the current status of each user
    statuses,

    // Total user stats
    stats,
});
