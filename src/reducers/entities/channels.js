// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {ChannelTypes, TeamTypes, UserTypes} from 'action_types';

function channelListToSet(state, action) {
    const id = action.teamId;
    const nextSet = new Set(state[id]);
    action.data.forEach((channel) => {
        nextSet.add(channel.id);
    });

    return {
        ...state,
        [id]: nextSet
    };
}

function removeChannelFromSet(state, action) {
    const id = action.data.team_id;
    const nextSet = new Set(state[id]);
    nextSet.delete(action.data.id);
    return {
        ...state,
        [id]: nextSet
    };
}

function currentChannelId(state = '', action) {
    switch (action.type) {
    case ChannelTypes.SELECT_CHANNEL:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

function channels(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL:
        return {
            ...state,
            [action.data.id]: action.data
        };

    case ChannelTypes.RECEIVED_CHANNELS: {
        for (const channel of action.data) {
            nextState[channel.id] = channel;
        }
        return nextState;
    }
    case ChannelTypes.RECEIVED_CHANNEL_DELETED:
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    case ChannelTypes.RECEIVED_LAST_VIEWED: {
        const channelId = action.data.channel_id;
        const lastUpdatedAt = action.data.last_viewed_at;
        const channel = state[channelId];
        if (!channel) {
            return state;
        }
        return {
            ...state,
            [channelId]: {
                ...channel,
                extra_update_at: lastUpdatedAt
            }
        };
    }
    case ChannelTypes.UPDATE_CHANNEL_HEADER: {
        const {channelId, header} = action.data;
        return {
            ...state,
            [channelId]: {
                ...state[channelId],
                header
            }
        };
    }
    case ChannelTypes.UPDATE_CHANNEL_PURPOSE: {
        const {channelId, purpose} = action.data;
        return {
            ...state,
            [channelId]: {
                ...state[channelId],
                purpose
            }
        };
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function channelsInTeam(state = {}, action) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL: {
        const nextSet = new Set(state[action.data.team_id]);
        nextSet.add(action.data.id);
        return {
            ...state,
            [action.data.team_id]: nextSet
        };
    }
    case ChannelTypes.RECEIVED_CHANNELS: {
        return channelListToSet(state, action);
    }
    case ChannelTypes.RECEIVED_CHANNEL_DELETED:
        return removeChannelFromSet(state, action);
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function myMembers(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER: {
        const channelMember = action.data;
        return {
            ...state,
            [channelMember.channel_id]: channelMember
        };
    }
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS: {
        for (const cm of action.data) {
            nextState[cm.channel_id] = cm;
        }
        return nextState;
    }
    case ChannelTypes.RECEIVED_CHANNEL_PROPS: {
        const member = {...state[action.data.channel_id]};
        member.notify_props = action.data.notifyProps;

        return {
            ...state,
            [action.data.channel_id]: member
        };
    }
    case ChannelTypes.RECEIVED_LAST_VIEWED: {
        let member = state[action.data.channel_id];
        if (!member) {
            return state;
        }
        member = {...member,
            last_viewed_at: action.data.last_viewed_at,
            msg_count: action.data.total_msg_count,
            mention_count: 0
        };

        return {
            ...state,
            [action.data.channel_id]: member
        };
    }
    case ChannelTypes.LEAVE_CHANNEL:
    case ChannelTypes.RECEIVED_CHANNEL_DELETED:
        if (action.data) {
            Reflect.deleteProperty(nextState, action.data.id);
            return nextState;
        }

        return state;

    case UserTypes.LOGOUT_SUCCESS:
    case TeamTypes.SELECT_TEAM:
        return {};
    default:
        return state;
    }
}

function members(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER:
    case ChannelTypes.RECEIVED_CHANNEL_MEMBER: {
        const channelMember = action.data;
        return {
            ...state,
            [channelMember.channel_id + channelMember.user_id]: channelMember
        };
    }
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS:
    case ChannelTypes.RECEIVED_CHANNEL_MEMBERS: {
        for (const cm of action.data) {
            nextState[cm.channel_id + cm.user_id] = cm;
        }
        return nextState;
    }

    case ChannelTypes.LEAVE_CHANNEL:
    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL:
        if (action.data) {
            Reflect.deleteProperty(nextState, action.data.id + action.data.user_id);
        }
        return nextState;

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function stats(state = {}, action) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL_STATS: {
        const nextState = {...state};
        const stat = action.data;
        nextState[stat.channel_id] = stat;

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
    case TeamTypes.SELECT_TEAM:
        return {};
    default:
        return state;
    }
}

export default combineReducers({

    // the current selected channel
    currentChannelId,

    // object where every key is the channel id and has and object with the channel detail
    channels,

    // object where every key is a team id and has set of channel ids that are on the team
    channelsInTeam,

    // object where every key is the channel id and has an object with the channel members detail
    myMembers,

    // object where every key is the channel id concatenated with the user id and has an object with the channel members detail
    members,

    // object where every key is the channel id and has an object with the channel stats
    stats
});
