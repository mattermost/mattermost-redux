// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import Client4 from 'client/client4';

const DEFAULT_SERVER = `${process.env.MATTERMOST_SERVER_URL || 'http://localhost:8065'}`; //eslint-disable-line no-process-env
const EMAIL = `${process.env.MATTERMOST_REDUX_EMAIL || 'redux-admin@simulator.amazonses.com'}`; //eslint-disable-line no-process-env
const PASSWORD = `${process.env.MATTERMOST_REDUX_PASSWORD || 'password1'}`; //eslint-disable-line no-process-env

class TestHelper {
    constructor() {
        this.basicClient = null;
        this.basicClient4 = null;

        this.basicUser = null;
        this.basicTeam = null;
        this.basicTeamMember = null;
        this.basicChannel = null;
        this.basicChannelMember = null;
        this.basicPost = null;
    }

    activateMocking() {
        if (!nock.isActive()) {
            nock.activate();
        }
    }

    assertStatusOkay = (data) => {
        assert(data);
        assert(data.status === 'OK');
    };

    generateId = () => {
        // Implementation taken from http://stackoverflow.com/a/2117523
        let id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

        id = id.replace(/[xy]/g, (c) => {
            const r = Math.floor(Math.random() * 16);

            let v;
            if (c === 'x') {
                v = r;
            } else {
                v = (r & 0x3) | 0x8;
            }

            return v.toString(16);
        });

        return 'uid' + id;
    };

    createClient4 = () => {
        const client = new Client4();

        client.setUrl(DEFAULT_SERVER);

        return client;
    };

    fakeEmail = () => {
        return 'success' + this.generateId() + '@simulator.amazonses.com';
    };

    fakeUser = () => {
        return {
            email: this.fakeEmail(),
            allow_marketing: true,
            password: PASSWORD,
            locale: 'en',
            username: this.generateId(),
            first_name: this.generateId(),
            last_name: this.generateId(),
        };
    };

    fakeUserWithId = () => {
        return {
            ...this.fakeUser(),
            id: this.generateId(),
        };
    };

    fakeTeam = () => {
        const name = this.generateId();
        let inviteId = this.generateId();
        if (inviteId.length > 32) {
            inviteId = inviteId.substring(0, 32);
        }

        return {
            name,
            display_name: `Unit Test ${name}`,
            type: 'O',
            email: this.fakeEmail(),
            allowed_domains: '',
            invite_id: inviteId,
        };
    };

    fakeTeamWithId = () => {
        return {
            ...this.fakeTeam(),
            id: this.generateId(),
        };
    };

    fakeTeamMember = (userId, teamId) => {
        return {
            user_id: userId,
            team_id: teamId,
            roles: 'team_user',
            delete_at: 0,
        };
    };

    fakeOutgoingHook = (teamId) => {
        return {
            teamId,
        };
    };

    fakeOutgoingHookWithId = (teamId) => {
        return {
            ...this.fakeOutgoingHook(teamId),
            id: this.generateId(),
        };
    };

    testIncomingHook = () => {
        return {
            id: this.generateId(),
            create_at: 1507840900004,
            update_at: 1507840900004,
            delete_at: 0,
            user_id: this.basicUser.id,
            channel_id: this.basicChannel.id,
            team_id: this.basicTeam.id,
            display_name: 'test',
            description: 'test',
        };
    };

    testOutgoingHook = () => {
        return {
            id: this.generateId(),
            token: this.generateId(),
            create_at: 1507841118796,
            update_at: 1507841118796,
            delete_at: 0,
            creator_id: this.basicUser.id,
            channel_id: this.basicChannel.id,
            team_id: this.basicTeam.id,
            trigger_words: ['testword'],
            trigger_when: 0,
            callback_urls: ['http://localhost/notarealendpoint'],
            display_name: 'test',
            description: '',
            content_type: 'application/x-www-form-urlencoded',
        };
    }

    testCommand = (teamId) => {
        return {
            trigger: this.generateId(),
            method: 'P',
            create_at: 1507841118796,
            update_at: 1507841118796,
            delete_at: 0,
            creator_id: this.basicUser.id,
            team_id: teamId,
            username: 'test',
            icon_url: 'http://localhost/notarealendpoint',
            auto_complete: true,
            auto_complete_desc: 'test',
            auto_complete_hint: 'test',
            display_name: 'test',
            description: 'test',
            url: 'http://localhost/notarealendpoint',
        };
    };

    fakeChannel = (teamId) => {
        const name = this.generateId();

        return {
            name,
            team_id: teamId,
            display_name: `Unit Test ${name}`,
            type: 'O',
            delete_at: 0,
            total_msg_count: 0,
        };
    };

    fakeChannelWithId = (teamId) => {
        return {
            ...this.fakeChannel(teamId),
            id: this.generateId(),
        };
    };

    fakeChannelMember = (userId, channelId) => {
        return {
            user_id: userId,
            channel_id: channelId,
            notify_props: {},
            roles: 'system_user',
            msg_count: 0,
            mention_count: 0,
        };
    };

    fakePost = (channelId) => {
        return {
            channel_id: channelId,
            message: `Unit Test ${this.generateId()}`,
        };
    };

    fakePostWithId = (channelId) => {
        return {
            ...this.fakePost(channelId),
            id: this.generateId(),
        };
    };

    fakeFiles = (count) => {
        const files = [];
        while (files.length < count) {
            files.push({
                id: this.generateId(),
            });
        }

        return files;
    };

    fakeOAuthApp = () => {
        return {
            name: this.generateId(),
            callback_urls: ['http://localhost/notrealurl'],
            homepage: 'http://localhost/notrealurl',
            description: 'fake app',
            is_trusted: false,
            icon_url: 'http://localhost/notrealurl',
            update_at: 1507841118796,
        };
    };

    fakeOAuthAppWithId = () => {
        return {
            ...this.fakeOAuthApp(),
            id: this.generateId(),
        };
    };

    mockLogin = () => {
        nock(this.basicClient4.getUsersRoute()).
            post('/login').
            reply(200, this.basicUser);

        nock(this.basicClient4.getUserRoute('me')).
            get('/teams/members').
            reply(200, [this.basicTeamMember]);

        nock(this.basicClient4.getUserRoute('me')).
            get('/teams/unread').
            reply(200, [{team_id: this.basicTeam.id, msg_count: 0, mention_count: 0}]);

        nock(this.basicClient4.getUserRoute('me')).
            get('/teams').
            reply(200, [this.basicTeam]);

        nock(this.basicClient4.getPreferencesRoute('me')).
            get('').
            reply(200, [{user_id: this.basicUser.id, category: 'tutorial_step', name: this.basicUser.id, value: '999'}]);
    }

    initRealEntities = async () => {
        try {
            this.basicUser = await this.basicClient4.login(EMAIL, PASSWORD);
            this.basicUser.password = PASSWORD;
            this.basicTeam = await this.basicClient4.createTeam(this.fakeTeam());
            this.basicChannel = await this.basicClient4.createChannel(this.fakeChannel(this.basicTeam.id));
            this.basicPost = await this.basicClient4.createPost(this.fakePost(this.basicChannel.id));
        } catch (error) {
            console.error('Unable to initialize against server: ' + error); //eslint-disable-line no-console
            throw error;
        }
    }

    isLiveServer = () => {
        return process.env.TEST_SERVER; //eslint-disable-line no-process-env
    }

    initMockEntities = () => {
        this.basicUser = this.fakeUserWithId();
        this.basicUser.roles = 'system_user system_admin';
        this.basicTeam = this.fakeTeamWithId();
        this.basicTeamMember = this.fakeTeamMember(this.basicUser.id, this.basicTeam.id);
        this.basicChannel = this.fakeChannelWithId(this.basicTeam.id);
        this.basicChannelMember = this.fakeChannelMember(this.basicUser.id, this.basicChannel.id);
        this.basicPost = {...this.fakePostWithId(this.basicChannel.id), create_at: 1507841118796};
    }

    initBasic = async (client4 = this.createClient4()) => {
        client4.setUrl(DEFAULT_SERVER);
        this.basicClient4 = client4;

        if (process.env.TEST_SERVER) { //eslint-disable-line no-process-env
            await this.initRealEntities();
        } else {
            this.initMockEntities();
            this.activateMocking();
        }

        return {
            client4: this.basicClient4,
            user: this.basicUser,
            team: this.basicTeam,
            channel: this.basicChannel,
            post: this.basicPost,
        };
    };

    tearDown = async () => {
        if (process.env.TEST_SERVER) { //eslint-disable-line no-process-env
            await this.basicClient4.logout();
        } else {
            nock.restore();
        }

        this.basicClient4 = null;
        this.basicUser = null;
        this.basicTeam = null;
        this.basicTeamMember = null;
        this.basicChannel = null;
        this.basicChannelMember = null;
        this.basicPost = null;
    }

    wait = (time) => new Promise((resolve) => setTimeout(resolve, time))
}

export default new TestHelper();
