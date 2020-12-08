// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {UserThread} from 'types/threads';
import {GlobalState} from 'types/store';
import {$ID} from 'types/utilities';

export function getThreads(state: GlobalState) {
    return state.entities.threads.threads;
}

export function getThread(state: GlobalState, threadId: $ID<UserThread>): UserThread {
    return getThreads(state)[threadId];
}

export function getThreadOrder(state: GlobalState): $ID<UserThread>[] {
    return state.entities.threads.order;
}
