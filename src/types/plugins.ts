// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type MarketplacePlugin = {
    homepage_url: string;
    download_url: string;
    manifest: {
        id: string;
        name: string;
        description: string;
        version: string;
        minServerVersion: string;
    };
    installed_version: string;
}
