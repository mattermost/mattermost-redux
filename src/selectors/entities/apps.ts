// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from 'types/store';
import {AppBinding} from 'types/apps';

export function getAppsBindings(state: GlobalState, location?: string): AppBinding[] {
    if (location) {
        return state.entities.apps.bindings.filter((p) => {
            return p.location_id === location;
        });
    }
    return state.entities.apps.bindings;
}
