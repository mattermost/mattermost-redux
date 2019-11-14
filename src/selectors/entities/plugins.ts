// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as reselect from 'reselect';
import {GlobalState} from 'types/store';

export function getMarketplacePlugins(state: GlobalState) {
    return state.entities.plugins.marketplacePlugins;
}

export const getMarketplaceInstalledPlugins = reselect.createSelector(
    getMarketplacePlugins,
    (plugins) => {
        return Object.values(plugins).filter((p) => p.installed_version !== '');
    }
);
