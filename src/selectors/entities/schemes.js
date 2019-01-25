// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {createSelector} from 'reselect';
import {getAllChannels} from 'selectors/entities/channels';
import {getTeams} from 'selectors/entities/teams';
import {ScopeTypes} from 'constants/schemes';
import type {GlobalState} from 'types/store';
import type {Scheme} from 'types/schemes';
import type {Channel} from 'types/channels';
import type {Team} from 'types/teams';

export function getSchemes(state: GlobalState): { [string]: Scheme } {
    return state.entities.schemes.schemes;
}

export function getScheme(state: GlobalState, id: string): Scheme {
    const schemes = getSchemes(state);
    return schemes[id];
}

export function makeGetSchemeChannels() {
    return (createSelector(
        getAllChannels,
        (state, props: {schemeId: string}) => getScheme(state, props.schemeId),
        (allChannels, scheme) => {
            if (!scheme) {
                return [];
            }

            if (scheme.scope === ScopeTypes.TEAM) {
                const msg = `Not implemented: scheme '${scheme.id}' is team-scope but 'getSchemeChannels' only accepts channel-scoped schemes.`;
                console.log(msg); // eslint-disable-line no-console
                return [];
            }

            const schemeChannels: Array<Channel> = [];

            // $FlowFixMe
            Object.entries(allChannels).forEach((item: [string, Channel]) => {
                const [, channel: Channel] = item;
                if (channel.scheme_id === scheme.id) {
                    schemeChannels.push(channel);
                }
            });

            return schemeChannels;
        }
    ): (GlobalState, {schemeId: string}) => Array<Channel>);
}

export function makeGetSchemeTeams() {
    return (createSelector(
        getTeams,
        (state, props: {schemeId: string}) => getScheme(state, props.schemeId),
        (allTeams, scheme) => {
            if (!scheme) {
                return [];
            }

            if (scheme.scope === ScopeTypes.CHANNEL) {
                const msg = `Error: scheme '${scheme.id}' is channel-scoped but 'getSchemeChannels' only accepts team-scoped schemes.`;
                console.log(msg); // eslint-disable-line no-console
                return [];
            }

            const schemeTeams: Array<Team> = [];

            // $FlowFixMe
            Object.entries(allTeams).forEach((item: [string, Team]) => {
                const [, team: Team] = item;
                if (team.scheme_id === scheme.id) {
                    schemeTeams.push(team);
                }
            });

            return schemeTeams;
        }
    ): (GlobalState, {schemeId: string}) => Array<Team>);
}
