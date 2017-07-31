// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Preferences} from 'constants';

export function getFullName(user) {
    if (user.first_name && user.last_name) {
        return user.first_name + ' ' + user.last_name;
    } else if (user.first_name) {
        return user.first_name;
    } else if (user.last_name) {
        return user.last_name;
    }

    return '';
}

export function displayUsername(user, teammateNameDisplay) {
    let name = '';

    if (user) {
        if (teammateNameDisplay === Preferences.DISPLAY_PREFER_NICKNAME) {
            name = user.nickname || getFullName(user);
        } else if (teammateNameDisplay === Preferences.DISPLAY_PREFER_FULL_NAME) {
            name = getFullName(user);
        }

        if (!name.trim().length) {
            name = user.username;
        }
    }

    return name;
}

export function rolesIncludePermission(roles, permission) {
    const rolesArray = roles.split(' ');
    return rolesArray.includes(permission);
}

export function isAdmin(roles) {
    return isSystemAdmin(roles) || isTeamAdmin(roles);
}

export function isTeamAdmin(roles) {
    return rolesIncludePermission(roles, General.TEAM_ADMIN_ROLE);
}

export function isSystemAdmin(roles) {
    return rolesIncludePermission(roles, General.SYSTEM_ADMIN_ROLE);
}

export function isChannelAdmin(roles) {
    return rolesIncludePermission(roles, General.CHANNEL_ADMIN_ROLE);
}

export function hasUserAccessTokenRole(roles) {
    return rolesIncludePermission(roles, General.SYSTEM_USER_ACCESS_TOKEN_ROLE);
}

export function hasPostAllRole(roles) {
    return rolesIncludePermission(roles, General.SYSTEM_POST_ALL_ROLE);
}

export function hasPostAllPublicRole(roles) {
    return rolesIncludePermission(roles, General.SYSTEM_POST_ALL_PUBLIC_ROLE);
}

export function profileListToMap(profileList) {
    const profiles = {};
    for (let i = 0; i < profileList.length; i++) {
        profiles[profileList[i].id] = profileList[i];
    }
    return profiles;
}

export function removeUserFromList(userId, list) {
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].id === userId) {
            list.splice(i, 1);
            return list;
        }
    }

    return list;
}

export function filterProfilesMatchingTerm(users, term) {
    const lowercasedTerm = term.toLowerCase();

    return users.filter((user) => {
        if (!user) {
            return false;
        }
        const username = (user.username || '').toLowerCase();
        const first = (user.first_name || '').toLowerCase();
        const last = (user.last_name || '').toLowerCase();
        const full = first + ' ' + last;
        const email = (user.email || '').toLowerCase();
        const nickname = (user.nickname || '').toLowerCase();

        let emailPrefix = '';
        let emailDomain = '';
        const split = email.split('@');
        emailPrefix = split[0];
        if (split.length > 1) {
            emailDomain = split[1];
        }

        return username.startsWith(lowercasedTerm) ||
            first.startsWith(lowercasedTerm) ||
            last.startsWith(lowercasedTerm) ||
            full.startsWith(lowercasedTerm) ||
            nickname.startsWith(term) ||
            emailPrefix.startsWith(term) ||
            emailDomain.startsWith(term);
    });
}

export function sortByUsername(a, b) {
    const nameA = a.username;
    const nameB = b.username;

    return nameA.localeCompare(nameB);
}
