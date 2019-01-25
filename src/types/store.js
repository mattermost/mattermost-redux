// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {AlertType} from './alerts';
import type {GeneralState} from './general';
import type {UsersState} from './users';
import type {TeamsState} from './teams';
import type {ChannelsState} from './channels';
import type {PostsState} from './posts';
import type {AdminState} from './admin';
import type {JobsState} from './jobs';
import type {SearchState} from './search';
import type {IntegrationsState} from './integrations';
import type {FilesState} from './files';
import type {EmojisState} from './emojis';
import type {SchemesState} from './schemes';
import type {Typing} from './typing';
import type {GroupsState} from './groups';
import type {
    ChannelsRequestsStatuses,
    GeneralRequestsStatuses,
    PostsRequestsStatuses,
    TeamsRequestsStatuses,
    UsersRequestsStatuses,
    PreferencesRequestsStatuses,
    AdminRequestsStatuses,
    FilesRequestsStatuses,
    IntegrationsRequestsStatuses,
    RolesRequestsStatuses,
    SchemesRequestsStatuses,
    GroupsRequestsStatuses,
    JobsRequestsStatuses,
    SearchRequestsStatuses,
} from './requests';
import type {Role} from './roles';
import type {PreferenceType} from './preferences';

export type GlobalState = {|
    entities: {|
        general: GeneralState,
        users: UsersState,
        teams: TeamsState,
        channels: ChannelsState,
        posts: PostsState,
        preferences: {|
            myPreferences: {[string]: PreferenceType}
        |},
        admin: AdminState,
        jobs: JobsState,
        alerts: {|
            alertStack: Array<AlertType>
        |},
        search: SearchState,
        integrations: IntegrationsState,
        files: FilesState,
        emojis: EmojisState,
        typing: Typing,
        roles: {
            roles: { [string]: Role },
            pending: Set<string>

        },
        schemes: SchemesState,
        gifs: Object,
        groups: GroupsState,
    |},
    errors: Array<Object>,
    requests: {|
        channels: ChannelsRequestsStatuses,
        general: GeneralRequestsStatuses,
        posts: PostsRequestsStatuses,
        teams: TeamsRequestsStatuses,
        users: UsersRequestsStatuses,
        preferences: PreferencesRequestsStatuses,
        admin: AdminRequestsStatuses,
        files: FilesRequestsStatuses,
        integrations: IntegrationsRequestsStatuses,
        roles: RolesRequestsStatuses,
        schemes: SchemesRequestsStatuses,
        groups: GroupsRequestsStatuses,
        jobs: JobsRequestsStatuses,
        schemes: SchemesRequestsStatuses,
        search: SearchRequestsStatuses,
    |}
|};
