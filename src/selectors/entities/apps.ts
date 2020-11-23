// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from 'types/store';
import {AppBinding} from 'types/apps';

export function getAppsBindings(state: GlobalState, location?: string): AppBinding[] {
    if (!state.entities.apps.bindings) {
        return [];
    }

    if (location) {
        const headerBindings = state.entities.apps.bindings.filter((b) => b.location === location);
        return headerBindings.reduce((accum: AppBinding[], current: AppBinding) => accum.concat(current.bindings || []), []);
    }
    return state.entities.apps.bindings;
}
