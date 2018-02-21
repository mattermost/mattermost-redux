// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import General from 'constants/general';

import {canManageMembers, isAutoClosed} from 'utils/channel_utils';

describe('ChannelUtils', () => {
    it('canManageMembers', () => {
        const notLicensed = {IsLicensed: 'false'};
        const licensed = {IsLicensed: 'true'};

        const anyoneCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_ANY};
        const channelAdminsCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_CHANNEL_ADMIN};
        const teamAdminsCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_TEAM_ADMIN};
        const systemAdminsCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_SYSTEM_ADMIN};

        const townSquareChannel = {name: General.DEFAULT_CHANNEL, type: General.OPEN_CHANNEL};
        const publicChannel = {type: General.PUBLIC_CHANNEL};
        const privateChannel = {type: General.PRIVATE_CHANNEL};
        const gmChannel = {type: General.GM_CHANNEL};
        const dmChannel = {type: General.DM_CHANNEL};

        const systemAdmin = {roles: General.SYSTEM_USER_ROLE + ' ' + General.SYSTEM_ADMIN_ROLE};
        const systemUser = {roles: General.SYSTEM_USER_ROLE};

        const teamAdmin = {roles: General.TEAM_USER_ROLE + ' ' + General.TEAM_ADMIN_ROLE};
        const teamUser = {roles: General.TEAM_USER_ROLE};

        const channelAdmin = {roles: General.CHANNEL_USER_ROLE + ' ' + General.CHANNEL_ADMIN_ROLE};
        const channelUser = {roles: General.CHANNEL_USER_ROLE};

        // No one can manage users of town square
        assert.ok(!canManageMembers(townSquareChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(!canManageMembers(townSquareChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));

        // Or DM/GM channels
        assert.ok(!canManageMembers(dmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(!canManageMembers(dmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(!canManageMembers(gmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(!canManageMembers(gmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));

        // Everyone can manage users of public channels
        assert.ok(canManageMembers(publicChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembers(publicChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembers(publicChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, notLicensed));
        assert.ok(canManageMembers(publicChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, notLicensed));
        assert.ok(canManageMembers(publicChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(publicChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(publicChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(publicChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, licensed));

        // And private channels if not licensed
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, notLicensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, notLicensed));

        // But it gets complicated when you have a license
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamAdmin, channelUser, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemAdmin, teamUser, channelUser, systemAdminsCanManageMembers, licensed));

        assert.ok(canManageMembers(privateChannel, systemUser, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamAdmin, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamAdmin, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamAdmin, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamAdmin, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamAdmin, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamAdmin, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamAdmin, channelUser, systemAdminsCanManageMembers, licensed));

        assert.ok(canManageMembers(privateChannel, systemUser, teamUser, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembers(privateChannel, systemUser, teamUser, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamUser, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamUser, channelAdmin, systemAdminsCanManageMembers, licensed));

        assert.ok(canManageMembers(privateChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamUser, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamUser, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembers(privateChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, licensed));
    });

    it('isAutoClosed', () => {
        const autoCloseEnabled = {CloseUnusedDirectMessages: 'true'};
        const autoCloseDisabled = {CloseUnusedDirectMessages: 'false'};
        const activeChannel = {id: 'channelid', last_post_at: new Date().getTime()};
        const inactiveChannel = {id: 'channelid', last_post_at: 1};
        const now = new Date().getTime();

        assert.ok(isAutoClosed(autoCloseEnabled, {}, inactiveChannel));

        assert.ok(isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, inactiveChannel));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, inactiveChannel, now));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, activeChannel));

        assert.ok(!isAutoClosed(autoCloseDisabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, inactiveChannel));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: now.toString()},
        }, inactiveChannel));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'never'},
        }, inactiveChannel));

        assert.ok(isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: (now - 1000).toString()},
        }, inactiveChannel, 0, now));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: now.toString()},
        }, inactiveChannel, 0, now - 1000));
    });
});
