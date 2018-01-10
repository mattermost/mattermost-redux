// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

const state = {
    entities: {
        general: {
            appState: false,
            credentials: {},
            config: {},
            dataRetentionPolicy: {},
            deviceToken: '',
            license: {},
            serverVersion: ''
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
            statuses: {}
        },
        teams: {
            currentTeamId: '',
            teams: {},
            myMembers: {},
            membersInTeam: {},
            stats: {}
        },
        channels: {
            currentChannelId: '',
            channels: {},
            channelsInTeam: {},
            myMembers: {},
            membersInChannel: {},
            stats: {}
        },
        posts: {
            posts: {},
            postsInChannel: {},
            selectedPostId: '',
            currentFocusedPostId: '',
            messagesHistory: {
                messages: [],
                index: {
                    post: -1,
                    comment: -1
                }
            }
        },
        preferences: {
            myPreferences: {}
        },
        admin: {
            logs: [],
            audits: {},
            config: {},
            complianceReports: {}
        },
        alerts: {
            alertStack: []
        },
        integrations: {
            incomingHooks: {},
            outgoingHooks: {},
            oauthApps: {},
            systemCommands: {},
            commands: {}
        },
        files: {
            files: {},
            fileIdsByPostId: {}
        },
        emojis: {
            customEmoji: {}
        },
        typing: {},
        roles: {
            roles: []
        }
    },
    errors: [],
    requests: {
        channels: {
            getChannel: {
                status: 'not_started',
                error: null
            },
            getChannels: {
                status: 'not_started',
                error: null
            },
            myMembers: {
                status: 'not_started',
                error: null
            },
            members: {
                status: 'not_started',
                error: null
            },
            myChannels: {
                status: 'not_started',
                error: null
            },
            createChannel: {
                status: 'not_started',
                error: null
            },
            updateChannel: {
                status: 'not_started',
                error: null
            },
            updateChannelNotifyProps: {
                status: 'not_started',
                error: null
            },
            joinChannel: {
                status: 'not_started',
                error: null
            },
            deleteChannel: {
                status: 'not_started',
                error: null
            },
            updateLastViewedAt: {
                status: 'not_started',
                error: null
            },
            getChannelStats: {
                status: 'not_started',
                error: null
            },
            addChannelMember: {
                status: 'not_started',
                error: null
            },
            removeChannelMember: {
                status: 'not_started',
                error: null
            },
            updateChannelMember: {
                status: 'not_started',
                error: null
            }
        },
        general: {
            server: {
                status: 'not_started',
                error: null
            },
            config: {
                status: 'not_started',
                error: null
            },
            dataRetentionPolicy: {
                status: 'not_started',
                error: null
            },
            license: {
                status: 'not_started',
                error: null
            },
            websocket: {
                status: 'not_started',
                error: null
            }
        },
        posts: {
            createPost: {
                status: 'not_started',
                error: null
            },
            editPost: {
                status: 'not_started',
                error: null
            },
            deletePost: {
                status: 'not_started',
                error: null
            },
            getPostThread: {
                status: 'not_started',
                error: null
            },
            getPostThreadRetryAttempts: 0,
            getPosts: {
                status: 'not_started',
                error: null
            },
            getPostsRetryAttempts: 0,
            getPostsSince: {
                status: 'not_started',
                error: null
            },
            getPostsSinceRetryAttempts: 0,
            getPostsBefore: {
                status: 'not_started',
                error: null
            },
            getPostsBeforeRetryAttempts: 0,
            getPostsAfter: {
                status: 'not_started',
                error: null
            },
            getPostsAfterRetryAttempts: 0
        },
        teams: {
            getMyTeams: {
                status: 'not_started',
                error: null
            },
            getTeams: {
                status: 'not_started',
                error: null
            },
            createTeam: {
                status: 'not_started',
                error: null
            },
            updateTeam: {
                status: 'not_started',
                error: null
            },
            getMyTeamMembers: {
                status: 'not_started',
                error: null
            },
            getTeamMembers: {
                status: 'not_started',
                error: null
            },
            getTeamStats: {
                status: 'not_started',
                error: null
            },
            addUserToTeam: {
                status: 'not_started',
                error: null
            },
            removeUserFromTeam: {
                status: 'not_started',
                error: null
            }
        },
        users: {
            checkMfa: {
                status: 'not_started',
                error: null
            },
            login: {
                status: 'not_started',
                error: null
            },
            logout: {
                status: 'not_started',
                error: null
            },
            create: {
                status: 'not_started',
                error: null
            },
            getProfiles: {
                status: 'not_started',
                error: null
            },
            getProfilesInTeam: {
                status: 'not_started',
                error: null
            },
            getProfilesInChannel: {
                status: 'not_started',
                error: null
            },
            getProfilesNotInChannel: {
                status: 'not_started',
                error: null
            },
            getUser: {
                status: 'not_started',
                error: null
            },
            getUserByUsername: {
                status: 'not_started',
                error: null
            },
            getStatusesByIds: {
                status: 'not_started',
                error: null
            },
            getSessions: {
                status: 'not_started',
                error: null
            },
            revokeSession: {
                status: 'not_started',
                error: null
            },
            getAudits: {
                status: 'not_started',
                error: null
            },
            autocompleteUsers: {
                status: 'not_started',
                error: null
            },
            searchProfiles: {
                status: 'not_started',
                error: null
            },
            updateMe: {
                status: 'not_started',
                error: null
            }
        },
        preferences: {
            getMyPreferences: {
                status: 'not_started',
                error: null
            },
            savePreferences: {
                status: 'not_started',
                error: null
            },
            deletePreferences: {
                status: 'not_started',
                error: null
            }
        },
        admin: {
            getLogs: {
                status: 'not_started',
                error: null
            },
            getAudits: {
                status: 'not_started',
                error: null
            },
            getConfig: {
                status: 'not_started',
                error: null
            },
            updateConfig: {
                status: 'not_started',
                error: null
            },
            reloadConfig: {
                status: 'not_started',
                error: null
            },
            testEmail: {
                status: 'not_started',
                error: null
            },
            invalidateCaches: {
                status: 'not_started',
                error: null
            },
            recycleDatabase: {
                status: 'not_started',
                error: null
            },
            createCompliance: {
                status: 'not_started',
                error: null
            },
            getCompliance: {
                status: 'not_started',
                error: null
            }
        },
        emojis: {
            createCustomEmoji: {
                status: 'not_started',
                error: null
            },
            getCustomEmojis: {
                status: 'not_started',
                error: null
            },
            deleteCustomEmoji: {
                status: 'not_started',
                error: null
            }
        },
        files: {
            getFilesForPost: {
                status: 'not_started',
                error: null
            },
            uploadFiles: {
                status: 'not_started',
                error: null
            },
            getFilePublicLink: {
                status: 'not_started',
                error: null
            }
        },
        integrations: {
            createIncomingHook: {
                status: 'not_started',
                error: null
            },
            getIncomingHooks: {
                status: 'not_started',
                error: null
            },
            deleteIncomingHook: {
                status: 'not_started',
                error: null
            },
            updateIncomingHook: {
                status: 'not_started',
                error: null
            },
            createOutgoingHook: {
                status: 'not_started',
                error: null
            },
            getOutgoingHooks: {
                status: 'not_started',
                error: null
            },
            deleteOutgoingHook: {
                status: 'not_started',
                error: null
            },
            updateOutgoingHook: {
                status: 'not_started',
                error: null
            },
            getCommands: {
                status: 'not_started',
                error: null
            },
            getAutocompleteCommands: {
                status: 'not_started',
                error: null
            },
            getCustomTeamCommands: {
                status: 'not_started',
                error: null
            },
            addCommand: {
                status: 'not_started',
                error: null
            },
            regenCommandToken: {
                status: 'not_started',
                error: null
            },
            editCommand: {
                status: 'not_started',
                error: null
            },
            deleteCommand: {
                status: 'not_started',
                error: null
            },
            addOAuthApp: {
                status: 'not_started',
                error: null
            },
            updateOAuthApp: {
                status: 'not_started',
                error: null
            },
            getOAuthApp: {
                status: 'not_started',
                error: null
            },
            getOAuthApps: {
                status: 'not_started',
                error: null
            },
            deleteOAuthApp: {
                status: 'not_started',
                error: null
            }
        }
    }
};

export default state;
