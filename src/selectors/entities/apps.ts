// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from 'types/store';
import {AppBinding} from 'types/apps';

export function getAppsBindings(state: GlobalState, location?: string): AppBinding[] {
    if (location) {
        const headerBindings = state.entities.apps.bindings.find((b) => b.location_id === location);
        if (headerBindings && headerBindings.bindings) {
            return headerBindings.bindings!;
        }
    }
    return state.entities.apps.bindings;
}
