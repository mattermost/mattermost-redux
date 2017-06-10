// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {ChannelTypes, UserTypes} from 'action_types';
import {General} from 'constants';

function channelListToSet(state, action) {
    const nextState = {...state};
    action.data.forEach((channel) => {
        const nextSet = new Set(nextState[channel.team_id]);
        nextSet.add(channel.id);
        nextState[channel.team_id] = nextSet;
    });

    return nextState;
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
    case ChannelTypes.LEAVE_CHANNEL: {
        if (action.data && action.data.type === General.PRIVATE_CHANNEL) {
            Reflect.deleteProperty(nextState, action.data.id);
            return nextState;
        }
        return state;
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
    case ChannelTypes.LEAVE_CHANNEL: {
        if (action.data && action.data.type === General.PRIVATE_CHANNEL) {
            return removeChannelFromSet(state, action);
        }
        return state;
    }
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
        const remove = action.remove;
        if (remove) {
            remove.forEach((id) => {
                Reflect.deleteProperty(nextState, id);
            });
        }

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
        return {};
    default:
        return state;
    }
}

function membersInChannel(state = {}, action) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER:
    case ChannelTypes.RECEIVED_CHANNEL_MEMBER: {
        const member = action.data;
        const members = {...(state[member.channel_id] || {})};
        members[member.user_id] = member;
        return {
            ...state,
            [member.channel_id]: members
        };
    }
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS:
    case ChannelTypes.RECEIVED_CHANNEL_MEMBERS: {
        const nextState = {...state};
        const remove = action.remove;
        if (remove) {
            remove.forEach((id) => {
                Reflect.deleteProperty(nextState, id);
            });
        }

        for (const cm of action.data) {
            if (nextState[cm.channel_id]) {
                nextState[cm.channel_id] = {...nextState[cm.channel_id]};
            } else {
                nextState[cm.channel_id] = {};
            }
            nextState[cm.channel_id][cm.user_id] = cm;
        }
        return nextState;
    }
    case ChannelTypes.LEAVE_CHANNEL:
    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL: {
        if (action.data) {
            const data = action.data;
            const members = {...(state[data.id] || {})};
            if (members) {
                Reflect.deleteProperty(members, data.user_id);
                return {
                    ...state,
                    [data.id]: members
                };
            }
        }

        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function stats(state = {}, action) {
    const nextState = {...state};
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL_STATS: {
        const stat = action.data;
        nextState[stat.channel_id] = stat;

        return nextState;
    }
    case ChannelTypes.RECEIVED_CHANNEL_MEMBER: {
        const id = action.channel_id;
        const nextStat = nextState[id];
        if (nextStat) {
            const count = nextStat.member_count + 1;
            return {
                ...nextState,
                [id]: {
                    ...nextStat,
                    member_count: count
                }
            };
        }

        return state;
    }
    case ChannelTypes.REMOVE_CHANNEL_MEMBER_SUCCESS: {
        const id = action.id;
        const nextStat = nextState[id];
        if (nextStat) {
            const count = nextStat.member_count - 1;
            return {
                ...nextState,
                [id]: {
                    ...nextStat,
                    member_count: count || 1
                }
            };
        }

        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
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

    // object where every key is the channel id with an object where key is a user id and has an object with the channel members detail
    membersInChannel,

    // object where every key is the channel id and has an object with the channel stats
    stats
});
