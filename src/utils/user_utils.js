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

export function displayUsername(user, myPreferences) {
    let nameFormat = 'false';
    const pref = myPreferences[`${Preferences.CATEGORY_DISPLAY_SETTINGS}--name_format`];
    if (pref && pref.value) {
        nameFormat = pref.value;
    }
    let username = '';

    if (user) {
        if (nameFormat === Preferences.DISPLAY_PREFER_NICKNAME) {
            username = user.nickname || getFullName(user);
        } else if (nameFormat === Preferences.DISPLAY_PREFER_FULL_NAME) {
            username = getFullName(user);
        }

        if (!username.trim().length) {
            username = user.username;
        }
    }
    return username;
}

export function isAdmin(roles) {
    return isSystemAdmin(roles) || isTeamAdmin(roles);
}

export function isTeamAdmin(roles) {
    return roles.includes(General.TEAM_ADMIN_ROLE);
}

export function isSystemAdmin(roles) {
    return roles.includes(General.SYSTEM_ADMIN_ROLE);
}

export function isChannelAdmin(roles) {
    return roles.includes(General.CHANNEL_ADMIN_ROLE);
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
