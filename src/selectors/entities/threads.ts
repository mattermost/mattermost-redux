// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {UserThread} from 'types/threads';
import {GlobalState} from 'types/store';
import {$ID, IDMappedObjects, RelationOneToMany} from 'types/utilities';
import {createSelector} from 'reselect';
import {getCurrentTeamId} from 'selectors/entities/teams';
import {Team} from 'types/teams';

export function getThreadsInTeam(state: GlobalState): RelationOneToMany<Team, UserThread> {
    return state.entities.threads.threadsInTeam;
}

export const getThreadsInCurrentTeam: (state: GlobalState) => Array<string> = createSelector(
    getCurrentTeamId,
    getThreadsInTeam,
    (currentTeamId: string, threadsInTeam: RelationOneToMany<Team, UserThread>): Array<string> => {
        return (threadsInTeam && threadsInTeam[currentTeamId]) || [];
    },
);

export function getThreads(state: GlobalState) {
    return state.entities.threads.threads;
}

export function getThread(state: GlobalState, threadId: $ID<UserThread>): UserThread {
    return getThreads(state)[threadId];
}

export const getThreadOrderInCurrentTeam: (state: GlobalState) => Array<string> = createSelector(
    getThreadsInCurrentTeam,
    getThreads,
    (threadsInTeam: Array<string>, threads: IDMappedObjects<UserThread>): Array<string> => {
        return threadsInTeam.sort((a, b) => threads[b].last_reply_at - threads[a].last_reply_at);
    },
);
