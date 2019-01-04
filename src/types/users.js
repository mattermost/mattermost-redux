// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type UserProfile = {|
    id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    username: string,
    auth_data: string,
    auth_service: string,
    email: string,
    email_verified: boolean,
    nickname: string,
    first_name: string,
    last_name: string,
    position: string,
    roles: string,
|};

export type UsersState = {|
    currentUserId: string,
    myAcceptedTermsOfServiceData: Object,
    mySessions: Array<Object>,
    myAudits: Array<Object>,
    profiles: {[string]: UserProfile},
    profilesInTeam: Object,
    profilesNotInTeam: Object,
    profilesWithoutTeam: Set<Object>,
    profilesInChannel: {[string]: Array<string>},
    profilesNotInChannel: {[string]: Array<string>},
    statuses: {[string]: string},
    stats: Object,
|};

export type UserTimezone = {|
    useAutomaticTimezone: boolean | string,
    automaticTimezone: string,
    manualTimezone: string,
|};
