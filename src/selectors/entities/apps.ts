// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from 'types/store';
import {AppBinding} from 'types/apps';

export function getAppsBindings(state: GlobalState, location?: string): AppBinding[] {
    if (location) {
        const bindings = state.entities.apps.bindings.find((p) => {
            return p.location === location;
        })?.bindings;
        if (bindings) {
            return bindings;
        }
        return [];
    }
    return state.entities.apps.bindings;
}
