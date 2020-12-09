// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';
import {getCurrentTeamId} from 'selectors/entities/teams';
import {GlobalState} from 'types/store';
import {Team} from 'types/teams';
import {UserThread} from 'types/threads';
import {$ID, IDMappedObjects, RelationOneToMany} from 'types/utilities';

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
        const ids = [...threadsInTeam];
        return ids.sort((a, b) => threads[b].last_reply_at - threads[a].last_reply_at);
    },
);
