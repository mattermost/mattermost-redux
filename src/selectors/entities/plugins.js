// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {MarketplacePluginStatus} from 'constants/plugins';

export function getMarketplacePlugins(state) {
    return state.entities.plugins.marketplacePlugins;
}

export const getMarketplaceInstalledPlugins = createSelector(
    getMarketplacePlugins,
    (plugins) => {
        return Object.values(plugins).filter((p) => p.Status === MarketplacePluginStatus.INSTALLED);
    }
);
