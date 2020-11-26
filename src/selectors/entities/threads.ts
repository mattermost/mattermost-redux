// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Thread} from 'types/threads';
import {GlobalState} from 'types/store';
import {$ID} from 'types/utilities';

export function getThreads(state: GlobalState) {
    return state.entities.threads.threads;
}

export function getThread(state: GlobalState, threadId: $ID<Thread>): Thread {
    return getThreads(state)[threadId];
}
