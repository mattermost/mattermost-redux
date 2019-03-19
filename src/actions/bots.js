// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from 'client';
import {BotTypes} from 'action_types';
import {bindClientFunc} from './helpers';

const BOTS_PER_PAGE_DEFAULT = 20;

export function createBot(bot) {
    return bindClientFunc({
        clientFunc: Client4.createBot,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNT,
        params: [
            bot,
        ],
    });
}

export function patchBot(botUserId, botPatch) {
    return bindClientFunc({
        clientFunc: Client4.patchBot,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNT,
        params: [
            botUserId,
            botPatch,
        ],
    });
}

export function loadBot(botUserId) {
    return bindClientFunc({
        clientFunc: Client4.getBot,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNT,
        params: [
            botUserId,
        ],
    });
}

export function loadBots(page = 0, perPage = BOTS_PER_PAGE_DEFAULT) {
    return bindClientFunc({
        clientFunc: Client4.getBotsIncludeDeleted,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNTS,
        params: [
            page,
            perPage,
        ],
    });
}

export function disableBot(botUserId) {
    return bindClientFunc({
        clientFunc: Client4.disableBot,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNT,
        params: [
            botUserId,
        ],
    });
}

export function enableBot(botUserId) {
    return bindClientFunc({
        clientFunc: Client4.enableBot,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNT,
        params: [
            botUserId,
        ],
    });
}

export function assignBot(botUserId, newOwnerId) {
    return bindClientFunc({
        clientFunc: Client4.assignBot,
        onSuccess: BotTypes.RECEIVED_BOT_ACCOUNT,
        params: [
            botUserId,
            newOwnerId,
        ],
    });
}
