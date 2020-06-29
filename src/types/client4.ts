// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// I assume these are the loglevels
export type logLevel = 'ERROR' | 'WARNING' | 'INFO';

export type ClientResponse<T> = {
    response: Response;
    headers: Map<string, string>;
    data: T;
};

type ErrorOffline = {
    message: string;
    url: string;
};
type ErrorInvalidResponse = {
    intl: {
        id: string;
        defaultMessage: string;
    };
};
export type ErrorApi = {
    message: string;
    server_error_id: string;
    status_code: number;
    url: string;
};
export type Client4Error = ErrorOffline | ErrorInvalidResponse | ErrorApi;

export type Options = {
    headers?: { [x: string]: string };
    method?: string;
    url?: string;
    credentials?: 'omit' | 'same-origin' | 'include';
    body?: any;
};

export type StatusOK = {
    status: 'OK';
};

export type CommandArgs = {
    channel_id?: string;
    team_id?: string;
    user_id?: string;
    root_id?: string;
    parent_id?: string;
    trigger_id?: string;
    command?: string;
}
