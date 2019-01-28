// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {General, Preferences} from 'constants';
import {localizeMessage} from 'utils/i18n_utils';

import type {UserProfile} from 'types/users';
import type {IDMappedObjects} from 'types/utilities';

export function getFullName(user: UserProfile): string {
    if (user.first_name && user.last_name) {
        return user.first_name + ' ' + user.last_name;
    } else if (user.first_name) {
        return user.first_name;
    } else if (user.last_name) {
        return user.last_name;
    }

    return '';
}

export function displayUsername(
    user: UserProfile,
    teammateNameDisplay: string,
    useFallbackUsername: boolean = true,
): string {
    let name = useFallbackUsername ? localizeMessage('channel_loader.someone', 'Someone') : '';

    if (user) {
        if (teammateNameDisplay === Preferences.DISPLAY_PREFER_NICKNAME) {
            name = user.nickname || getFullName(user);
        } else if (teammateNameDisplay === Preferences.DISPLAY_PREFER_FULL_NAME) {
            name = getFullName(user);
        } else {
            name = user.username;
        }

        if (!name || name.trim().length === 0) {
            name = user.username;
        }
    }

    return name;
}

export function rolesIncludePermission(roles: string, permission: string): boolean {
    const rolesArray = roles.split(' ');
    return rolesArray.includes(permission);
}

export function isAdmin(roles: string): boolean {
    return isSystemAdmin(roles) || isTeamAdmin(roles);
}

export function isTeamAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.TEAM_ADMIN_ROLE);
}

export function isSystemAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_ADMIN_ROLE);
}

export function isChannelAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.CHANNEL_ADMIN_ROLE);
}

export function hasUserAccessTokenRole(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_USER_ACCESS_TOKEN_ROLE);
}

export function hasPostAllRole(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_POST_ALL_ROLE);
}

export function hasPostAllPublicRole(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_POST_ALL_PUBLIC_ROLE);
}

export function profileListToMap(profileList: Array<UserProfile>): IDMappedObjects<UserProfile> {
    const profiles = {};
    for (let i = 0; i < profileList.length; i++) {
        profiles[profileList[i].id] = profileList[i];
    }
    return profiles;
}

export function removeUserFromList(userId: string, list: Array<UserProfile>): Array<UserProfile> {
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].id === userId) {
            list.splice(i, 1);
            return list;
        }
    }

    return list;
}

export function filterProfilesMatchingTerm(users: Array<UserProfile>, term: string): Array<UserProfile> {
    const lowercasedTerm = term.toLowerCase();
    let trimmedTerm = lowercasedTerm;
    if (trimmedTerm.startsWith('@')) {
        trimmedTerm = trimmedTerm.substr(1);
    }

    return users.filter((user: UserProfile) => {
        if (!user) {
            return false;
        }
        const username = (user.username || '').toLowerCase();
        const first = (user.first_name || '').toLowerCase();
        const last = (user.last_name || '').toLowerCase();
        const full = first + ' ' + last;
        const email = (user.email || '').toLowerCase();
        const nickname = (user.nickname || '').toLowerCase();

        let emailDomain = '';
        const split = email.split('@');
        if (split.length > 1) {
            emailDomain = split[1];
        }

        return username.startsWith(trimmedTerm) ||
            full.startsWith(trimmedTerm) ||
            last.startsWith(lowercasedTerm) ||
            nickname.startsWith(trimmedTerm) ||
            email.startsWith(lowercasedTerm) ||
            emailDomain.startsWith(trimmedTerm);
    });
}

export function sortByUsername(a: UserProfile, b: UserProfile): number {
    const nameA = a.username;
    const nameB = b.username;

    return nameA.localeCompare(nameB);
}
