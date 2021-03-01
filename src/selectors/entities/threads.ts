// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Preferences from 'constants/preferences';
import {createSelector} from 'reselect';
import {getCurrentTeamId} from 'selectors/entities/teams';
import {GlobalState} from 'types/store';
import {Team} from 'types/teams';
import {UserThread, ThreadsState} from 'types/threads';
import {$ID, IDMappedObjects, RelationOneToMany} from 'types/utilities';
import {getConfig, getFeatureFlagValue} from './general';
import {get} from 'selectors/entities/preferences';

export function getThreadsInTeam(state: GlobalState): RelationOneToMany<Team, UserThread> {
    return state.entities.threads.threadsInTeam;
}

export const getThreadsInCurrentTeam: (state: GlobalState) => Array<$ID<UserThread>> = createSelector(
    getCurrentTeamId,
    getThreadsInTeam,
    (
        currentTeamId,
        threadsInTeam,
    ) => {
        return threadsInTeam?.[currentTeamId] ?? [];
    },
);

export function getThreadCounts(state: GlobalState): ThreadsState['counts'] {
    return state.entities.threads.counts;
}

export function getTeamThreadCounts(state: GlobalState, teamId: $ID<Team>): ThreadsState['counts'][$ID<Team>] {
    return getThreadCounts(state)[teamId];
}

export const getThreadCountsInCurrentTeam: (state: GlobalState) => ThreadsState['counts'][$ID<Team>] = createSelector(
    getCurrentTeamId,
    getThreadCounts,
    (
        currentTeamId,
        counts,
    ) => {
        return counts?.[currentTeamId];
    },
);

export function getThreads(state: GlobalState): IDMappedObjects<UserThread> {
    return state.entities.threads.threads;
}

export function getThread(state: GlobalState, threadId: $ID<UserThread> | undefined): UserThread | null {
    if (!threadId || !getThreadsInCurrentTeam(state)?.includes(threadId)) {
        return null;
    }
    return getThreads(state)[threadId];
}

export const getThreadOrderInCurrentTeam: (state: GlobalState) => Array<$ID<UserThread>> = createSelector(
    getThreadsInCurrentTeam,
    getThreads,
    (
        threadsInTeam,
        threads,
    ) => {
        const ids = [...threadsInTeam];
        return sortByLastReply(ids, threads);
    },
);

export const getUnreadThreadOrderInCurrentTeam: (state: GlobalState) => Array<$ID<UserThread>> = createSelector(
    getThreadsInCurrentTeam,
    getThreads,
    (
        threadsInTeam,
        threads,
    ) => {
        const ids = threadsInTeam.filter((id) => {
            const thread = threads[id];
            return thread.unread_mentions || thread.unread_replies;
        });

        return sortByLastReply(ids, threads);
    },
);

function sortByLastReply(ids: Array<$ID<UserThread>>, threads: ReturnType<typeof getThreads>) {
    return ids.sort((a, b) => threads[b].last_reply_at - threads[a].last_reply_at);
}

export function getCollapsedThreadsPreference(state: GlobalState): string {
    const configValue = getConfig(state).CollapsedThreads;
    let preferenceDefault;

    switch (configValue) {
    case 'default_off':
        preferenceDefault = Preferences.COLLAPSED_REPLY_THREADS_OFF;
        break;
    case 'default_on':
        preferenceDefault = Preferences.COLLAPSED_REPLY_THREADS_ON;
        break;
    }

    return get(
        state,
        Preferences.CATEGORY_DISPLAY_SETTINGS,
        Preferences.COLLAPSED_REPLY_THREADS,
        preferenceDefault ?? Preferences.COLLAPSED_REPLY_THREADS_FALLBACK_DEFAULT,
    );
}

export function isCollapsedThreadsAllowed(state: GlobalState): boolean {
    return (
        getFeatureFlagValue(state, 'CollapsedThreads') === 'true' &&
        getConfig(state).CollapsedThreads !== 'disabled'
    );
}

export function isCollapsedThreadsEnabled(state: GlobalState): boolean {
    const isAllowed = isCollapsedThreadsAllowed(state);
    const userPreference = getCollapsedThreadsPreference(state);

    return isAllowed && (userPreference === Preferences.COLLAPSED_REPLY_THREADS_ON || getConfig(state).CollapsedThreads as string === 'always_on');
}
