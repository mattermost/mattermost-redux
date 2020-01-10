// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {AlertType} from './alerts';
import {GeneralState} from './general';
import {UsersState} from './users';
import {TeamsState} from './teams';
import {ChannelsState} from './channels';
import {PostsState} from './posts';
import {AdminState} from './admin';
import {JobsState} from './jobs';
import {SearchState} from './search';
import {IntegrationsState} from './integrations';
import {FilesState} from './files';
import {EmojisState} from './emojis';
import {SchemesState} from './schemes';
import {Typing} from './typing';
import {GroupsState} from './groups';
import {ChannelsRequestsStatuses, GeneralRequestsStatuses, PostsRequestsStatuses, TeamsRequestsStatuses, UsersRequestsStatuses, PreferencesRequestsStatuses, AdminRequestsStatuses, FilesRequestsStatuses, RolesRequestsStatuses, JobsRequestsStatuses, SearchRequestsStatuses} from './requests';
import {Role} from './roles';
import {PreferenceType} from './preferences';
import {Bot} from './bots';
import {Dictionary} from './utilities';

export type GlobalState = {
    entities: {
        general: GeneralState;
        users: UsersState;
        teams: TeamsState;
        channels: ChannelsState;
        posts: PostsState;
        bots: {
            accounts: Dictionary<Bot>;
        };
        preferences: {
            myPreferences: {
                [x: string]: PreferenceType;
            };
        };
        admin: AdminState;
        jobs: JobsState;
        alerts: {
            alertStack: Array<AlertType>;
        };
        search: SearchState;
        integrations: IntegrationsState;
        files: FilesState;
        emojis: EmojisState;
        typing: Typing;
        roles: {
            roles: {
                [x: string]: Role;
            };
            pending: Set<string>;
        };
        schemes: SchemesState;
        gifs: any;
        groups: GroupsState;
    };
    errors: Array<any>;
    requests: {
        channels: ChannelsRequestsStatuses;
        general: GeneralRequestsStatuses;
        posts: PostsRequestsStatuses;
        teams: TeamsRequestsStatuses;
        users: UsersRequestsStatuses;
        preferences: PreferencesRequestsStatuses;
        admin: AdminRequestsStatuses;
        files: FilesRequestsStatuses;
        roles: RolesRequestsStatuses;
        jobs: JobsRequestsStatuses;
        search: SearchRequestsStatuses;
    };
    websocket: {
        connected: boolean;
        lastConnectAt: number;
        lastDisconnectAt: number;
    };
};
