// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {GlobalState} from 'types/store';

const state: GlobalState = {
    entities: {
        general: {
            appState: false,
            credentials: {},
            config: {},
            dataRetentionPolicy: {},
            deviceToken: '',
            license: {},
            serverVersion: '',
            timezones: [],
        },
        users: {
            currentUserId: '',
            mySessions: [],
            myAudits: [],
            profiles: {},
            profilesInTeam: {},
            profilesNotInTeam: {},
            profilesWithoutTeam: new Set(),
            profilesInChannel: {},
            profilesNotInChannel: {},
            statuses: {},
            stats: {},
        },
        teams: {
            currentTeamId: '',
            teams: {},
            myMembers: {},
            membersInTeam: {},
            stats: {},
            groupsAssociatedToTeam: {},
        },
        channels: {
            currentChannelId: '',
            channels: {},
            channelsInTeam: {},
            myMembers: {},
            membersInChannel: {},
            stats: {},
            groupsAssociatedToChannel: {},
        },
        posts: {
            expandedURLs: {},
            posts: {},
            postsInChannel: {},
            postsInThread: {},
            pendingPostIds: [],
            reactions: {},
            openGraph: {},
            selectedPostId: '',
            currentFocusedPostId: '',
            messagesHistory: {
                messages: [],
                index: {
                    post: -1,
                    comment: -1,
                },
            },
        },
        preferences: {
            myPreferences: {},
        },
        admin: {
            logs: [],
            audits: {},
            config: {},
            environmentConfig: {},
            complianceReports: {},
            ldapGroups: {},
            ldapGroupsCount: 0,
        },
        jobs: {
            jobs: {},
            jobsByTypeList: {},
        },
        alerts: {
            alertStack: [],
        },
        integrations: {
            incomingHooks: {},
            outgoingHooks: {},
            oauthApps: {},
            systemCommands: {},
            commands: {},
        },
        files: {
            files: {},
            fileIdsByPostId: {},
        },
        emojis: {
            customEmoji: {},
            nonExistentEmoji: new Set(),
        },
        search: {
            results: [],
            recent: {},
            matches: {},
        },
        typing: {},
        roles: {
            roles: {},
            pending: new Set(),
        },
        gifs: {
            categories: {
                tagsList: [],
                tagsDict: {},
            },
            cache: {
                gifs: {},
                updating: false,
            },
            search: {
                searchText: '',
                searchBarText: '',
                resultsByTerm: {},
                scrollPosition: 0,
                priorLocation: null,
            },
        },
        schemes: {schemes: {}},
        groups: {
            groups: {},
            syncables: {},
            members: {},
        },
    },
    errors: [],
    requests: {
        channels: {
            getAllChannels: {
                status: 'not_started',
                error: null,
            },
            getChannels: {
                status: 'not_started',
                error: null,
            },
            myChannels: {
                status: 'not_started',
                error: null,
            },
            createChannel: {
                status: 'not_started',
                error: null,
            },
            updateChannel: {
                status: 'not_started',
                error: null,
            },
        },
        general: {
            server: {
                status: 'not_started',
                error: null,
            },
            config: {
                status: 'not_started',
                error: null,
            },
            dataRetentionPolicy: {
                status: 'not_started',
                error: null,
            },
            license: {
                status: 'not_started',
                error: null,
            },
            websocket: {
                status: 'not_started',
                error: null,
            },
            redirectLocation: {
                status: 'not_started',
                error: null,
            },
        },
        posts: {
            createPost: {
                status: 'not_started',
                error: null,
            },
            editPost: {
                status: 'not_started',
                error: null,
            },
            getPostThread: {
                status: 'not_started',
                error: null,
            },
        },
        teams: {
            getMyTeams: {
                status: 'not_started',
                error: null,
            },
            getTeams: {
                status: 'not_started',
                error: null,
            },
            joinTeam: {
                status: 'not_started',
                error: null,
            },
        },
        users: {
            checkMfa: {
                status: 'not_started',
                error: null,
            },
            login: {
                status: 'not_started',
                error: null,
            },
            logout: {
                status: 'not_started',
                error: null,
            },
            autocompleteUsers: {
                status: 'not_started',
                error: null,
            },
            updateMe: {
                status: 'not_started',
                error: null,
            },
        },
        preferences: {
            getMyPreferences: {
                status: 'not_started',
                error: null,
            },
            savePreferences: {
                status: 'not_started',
                error: null,
            },
            deletePreferences: {
                status: 'not_started',
                error: null,
            },
        },
        admin: {
            getLogs: {
                status: 'not_started',
                error: null,
            },
            getAudits: {
                status: 'not_started',
                error: null,
            },
            getConfig: {
                status: 'not_started',
                error: null,
            },
            updateConfig: {
                status: 'not_started',
                error: null,
            },
            reloadConfig: {
                status: 'not_started',
                error: null,
            },
            testEmail: {
                status: 'not_started',
                error: null,
            },
            testS3Connection: {
                status: 'not_started',
                error: null,
            },
            invalidateCaches: {
                status: 'not_started',
                error: null,
            },
            recycleDatabase: {
                status: 'not_started',
                error: null,
            },
            createCompliance: {
                status: 'not_started',
                error: null,
            },
            getCompliance: {
                status: 'not_started',
                error: null,
            },
            deleteBrandImage: {
                status: 'not_started',
                error: null,
            },
            disablePlugin: {
                status: 'not_started',
                error: null,
            },
            enablePlugin: {
                status: 'not_started',
                error: null,
            },
            getAnalytics: {
                status: 'not_started',
                error: null,
            },
            getClusterStatus: {
                status: 'not_started',
                error: null,
            },
            getEnvironmentConfig: {
                status: 'not_started',
                error: null,
            },
            getPluginStatuses: {
                status: 'not_started',
                error: null,
            },
            getPlugins: {
                status: 'not_started',
                error: null,
            },
            getSamlCertificateStatus: {
                status: 'not_started',
                error: null,
            },
            purgeElasticsearchIndexes: {
                status: 'not_started',
                error: null,
            },
            removeIdpSamlCertificate: {
                status: 'not_started',
                error: null,
            },
            removeLicense: {
                status: 'not_started',
                error: null,
            },
            removePlugin: {
                status: 'not_started',
                error: null,
            },
            removePrivateSamlCertificate: {
                status: 'not_started',
                error: null,
            },
            removePublicSamlCertificate: {
                status: 'not_started',
                error: null,
            },
            syncLdap: {
                status: 'not_started',
                error: null,
            },
            testElasticsearch: {
                status: 'not_started',
                error: null,
            },
            testLdap: {
                status: 'not_started',
                error: null,
            },
            uploadBrandImage: {
                status: 'not_started',
                error: null,
            },
            uploadIdpSamlCertificate: {
                status: 'not_started',
                error: null,
            },
            uploadLicense: {
                status: 'not_started',
                error: null,
            },
            uploadPlugin: {
                status: 'not_started',
                error: null,
            },
            uploadPrivateSamlCertificate: {
                status: 'not_started',
                error: null,
            },
            uploadPublicSamlCertificate: {
                status: 'not_started',
                error: null,
            },
            getLdapGroups: {
                status: 'not_started',
                error: null,
            },
            unlinkLdapGroup: {
                status: 'not_started',
                error: null,
            },
            linkLdapGroup: {
                status: 'not_started',
                error: null,
            },
        },
        files: {
            uploadFiles: {
                status: 'not_started',
                error: null,
            },
        },
        integrations: {
            createIncomingHook: {
                status: 'not_started',
                error: null,
            },
            getIncomingHooks: {
                status: 'not_started',
                error: null,
            },
            deleteIncomingHook: {
                status: 'not_started',
                error: null,
            },
            updateIncomingHook: {
                status: 'not_started',
                error: null,
            },
            createOutgoingHook: {
                status: 'not_started',
                error: null,
            },
            getOutgoingHooks: {
                status: 'not_started',
                error: null,
            },
            deleteOutgoingHook: {
                status: 'not_started',
                error: null,
            },
            updateOutgoingHook: {
                status: 'not_started',
                error: null,
            },
            getCommands: {
                status: 'not_started',
                error: null,
            },
            getAutocompleteCommands: {
                status: 'not_started',
                error: null,
            },
            getCustomTeamCommands: {
                status: 'not_started',
                error: null,
            },
            addCommand: {
                status: 'not_started',
                error: null,
            },
            regenCommandToken: {
                status: 'not_started',
                error: null,
            },
            editCommand: {
                status: 'not_started',
                error: null,
            },
            deleteCommand: {
                status: 'not_started',
                error: null,
            },
            addOAuthApp: {
                status: 'not_started',
                error: null,
            },
            updateOAuthApp: {
                status: 'not_started',
                error: null,
            },
            getOAuthApp: {
                status: 'not_started',
                error: null,
            },
            getOAuthApps: {
                status: 'not_started',
                error: null,
            },
            deleteOAuthApp: {
                status: 'not_started',
                error: null,
            },
            executeCommand: {
                status: 'not_started',
                error: null,
            },
            submitInteractiveDialog: {
                status: 'not_started',
                error: null,
            },
        },
        roles: {
            getRolesByNames: {
                status: 'not_started',
                error: null,
            },
            getRoleByName: {
                status: 'not_started',
                error: null,
            },
            getRole: {
                status: 'not_started',
                error: null,
            },
            editRole: {
                status: 'not_started',
                error: null,
            },
        },
        schemes: {
            getSchemes: {
                status: 'not_started',
                error: null,
            },
            getScheme: {
                status: 'not_started',
                error: null,
            },
            createScheme: {
                status: 'not_started',
                error: null,
            },
            deleteScheme: {
                status: 'not_started',
                error: null,
            },
            patchScheme: {
                status: 'not_started',
                error: null,
            },
            getSchemeTeams: {
                status: 'not_started',
                error: null,
            },
            getSchemeChannels: {
                status: 'not_started',
                error: null,
            },
        },
        jobs: {
            createJob: {
                status: 'not_started',
                error: null,
            },
            getJob: {
                status: 'not_started',
                error: null,
            },
            getJobs: {
                status: 'not_started',
                error: null,
            },
            cancelJob: {
                status: 'not_started',
                error: null,
            },
        },
        search: {
            flaggedPosts: {
                status: 'not_started',
                error: null,
            },
            pinnedPosts: {
                status: 'not_started',
                error: null,
            },
            recentMentions: {
                status: 'not_started',
                error: null,
            },
            searchPosts: {
                status: 'not_started',
                error: null,
            },
        },
        groups: {
            linkGroupSyncable: {
                status: 'not_started',
                error: null,
            },
            unlinkGroupSyncable: {
                status: 'not_started',
                error: null,
            },
            getGroupSyncables: {
                status: 'not_started',
                error: null,
            },
            getGroupMembers: {
                status: 'not_started',
                error: null,
            },
            getGroup: {
                status: 'not_started',
                error: null,
            },
            getAllGroupsAssociatedToTeam: {
                status: 'not_started',
                error: null,
            },
            getAllGroupsAssociatedToChannel: {
                status: 'not_started',
                error: null,
            },
            getGroupsAssociatedToTeam: {
                status: 'not_started',
                error: null,
            },
            getGroupsAssociatedToChannel: {
                status: 'not_started',
                error: null,
            },
            getGroupsNotAssociatedToTeam: {
                status: 'not_started',
                error: null,
            },
            getGroupsNotAssociatedToChannel: {
                status: 'not_started',
                error: null,
            },
        },
    },
};

export default state;
