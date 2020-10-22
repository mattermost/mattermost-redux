// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from 'types/store';
import {PluginLocation} from 'types/plugins';

export function getPluginsLocations(state: GlobalState, location?: string): PluginLocation[] {
    if (location) {
        return state.entities.plugins.locations.filter((p) => {
            return p.location_type === location;
        });
    }
    return state.entities.plugins.locations;
}
