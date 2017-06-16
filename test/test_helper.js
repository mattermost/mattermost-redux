// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import Client from 'client/client';
import Client4 from 'client/client4';

const DEFAULT_SERVER = 'http://localhost:8065';
const PASSWORD = 'password1';

class TestHelper {
    constructor() {
        this.basicClient = null;
        this.basicClient4 = null;

        this.basicUser = null;
        this.basicTeam = null;
        this.basicChannel = null;
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

    createClient = () => {
        const client = new Client();

        client.setUrl(DEFAULT_SERVER);

        return client;
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
            last_name: this.generateId()
        };
    };

    fakeUserWithId = () => {
        return {
            ...this.fakeUser(),
            id: this.generateId()
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
            invite_id: inviteId
        };
    };

    fakeTeamWithId = () => {
        return {
            ...this.fakeTeam(),
            id: this.generateId()
        };
    };

    testCommand = () => {
        return {
            trigger: this.generateId(),
            method: 'P',
            username: 'test',
            icon_url: 'http://localhost/notarealendpoint',
            auto_complete: true,
            auto_complete_desc: 'test',
            auto_complete_hint: 'test',
            display_name: 'test',
            description: 'test',
            url: 'http://localhost/notarealendpoint'
        };
    };

    fakeChannel = (teamId) => {
        const name = this.generateId();

        return {
            name,
            team_id: teamId,
            display_name: `Unit Test ${name}`,
            type: 'O',
            delete_at: 0
        };
    };

    fakeChannelWithId = (teamId) => {
        return {
            ...this.fakeChannel(teamId),
            id: this.generateId()
        };
    };

    fakeChannelMember = (userId, channelId) => {
        return {
            user_id: userId,
            channel_id: channelId,
            notify_props: {},
            roles: 'system_user'
        };
    };

    fakePost = (channelId) => {
        return {
            channel_id: channelId,
            message: `Unit Test ${this.generateId()}`
        };
    };

    fakeFiles = (count) => {
        const files = [];
        while (files.length < count) {
            files.push({
                id: this.generateId()
            });
        }

        return files;
    }

    fakeOAuthApp = () => {
        return {
            name: this.generateId(),
            callback_urls: ['http://localhost/notrealurl'],
            homepage: 'http://localhost/notrealurl',
            description: 'fake app',
            is_trusted: false,
            icon_url: 'http://localhost/notrealurl'
        };
    }

    initBasic = async (client = this.createClient(), client4 = this.createClient4()) => {
        client.setUrl(DEFAULT_SERVER);
        client4.setUrl(DEFAULT_SERVER);
        this.basicClient = client;
        this.basicClient4 = client4;

        this.basicUser = await client.createUser(this.fakeUser());
        await client.login(this.basicUser.email, PASSWORD);
        await client4.login(this.basicUser.email, PASSWORD);

        this.basicTeam = await client4.createTeam(this.fakeTeam());

        this.basicChannel = await client4.createChannel(this.fakeChannel(this.basicTeam.id));
        this.basicPost = await client4.createPost(this.fakePost(this.basicChannel.id));

        return {
            client: this.basicClient,
            client4: this.basicClient4,
            user: this.basicUser,
            team: this.basicTeam,
            channel: this.basicChannel,
            post: this.basicPost
        };
    };

    wait = (time) => new Promise((resolve) => setTimeout(resolve, time))
}

export default new TestHelper();
