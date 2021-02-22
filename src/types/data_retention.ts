// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type DataRetentionCustomPolicy = {
    id: string;
    display_name: string;
    post_duration: number;
    team_count: number;
    channel_count: number;
};

export type DataRetentionCustomPolicies = {
    [x: string]: DataRetentionCustomPolicy;
};