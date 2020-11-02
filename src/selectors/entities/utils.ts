// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {getMyChannelMemberships, getAllDirectChannelsNameMapInCurrentTeam} from 'selectors/entities/channels';
import {getCurrentUserId} from 'selectors/entities/users';

import {GlobalState} from 'types/store';
import {UserProfile, userProfileWithLastViewAt} from 'types/users';
import {getDirectChannelName} from 'utils/channel_utils';

export function makeAddLastViewAtToProfiles(): (state: GlobalState, profiles: UserProfile[]) => Array<userProfileWithLastViewAt> {
    return createSelector(
        getCurrentUserId,
        getMyChannelMemberships,
        getAllDirectChannelsNameMapInCurrentTeam,
        (state: GlobalState, profiles: UserProfile[]) => profiles,
        (currentUserId, memberships, allDmChannels, profiles) => {
            const formattedProfiles: userProfileWithLastViewAt[] = profiles.map((profile) => {
                const channelName = getDirectChannelName(currentUserId, profile.id);
                const channel = allDmChannels[channelName];
                const membership = channel ? memberships[channel.id] : null;
                return {
                    ...profile,
                    last_viewed_at: channel && membership ? membership.last_viewed_at : 0,
                };
            });
            return formattedProfiles;
        },
    );
}
