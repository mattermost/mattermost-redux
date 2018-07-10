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
import type {
    ChannelsRequestsStatuses,
    GeneralRequestsStatuses,
    PostsRequestsStatuses,
    TeamsRequestsStatuses,
    UsersRequestsStatuses,
    PreferencesRequestsStatuses,
    AdminRequestsStatuses,
    EmojisRequestsStatuses,
    FilesRequestsStatuses,
    IntegrationsRequestsStatuses,
    RolesRequestsStatuses,
    SchemesRequestsStatuses,
} from './requests';
import type {Role} from './roles';

export type GlobalState = {|
    entities: {|
        general: GeneralState,
        users: UsersState,
        teams: TeamsState,
        channels: ChannelsState,
        posts: PostsState,
        preferences: {|
            myPreferences: Object
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
        emojis: EmojisRequestsStatuses,
        files: FilesRequestsStatuses,
        integrations: IntegrationsRequestsStatuses,
        roles: RolesRequestsStatuses,
        schemes: SchemesRequestsStatuses
    |}
|};
