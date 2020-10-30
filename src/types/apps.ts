// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type AppsState = {
    bindings: Binding[];
};

export type CallExpandLevel = string;
export type CallResponseType = string;

export const CallResponseTypes: {[name: string]: CallResponseType} = {
    CALL: 'call',
    MODAL: 'modal',
    OK: 'ok',
    NAVIGATE: 'navigate',
    ERROR: 'error',
    COMMAND: 'command',
};

export const CallExpandLevels: {[name: string]: CallExpandLevel} = {
    EXPAND_ALL: 'All',
    EXPAND_SUMMARY: 'Summary',
};

export type DialogElement = {};

export type InteractiveDialogConfig = {
    trigger_id: string;
    url: string;
    app_id: string;
    dialog: {
        callback_id: string;
        title: string;
        introduction_text: string;
        elements: DialogElement[];
        submit_label: string;
        notify_on_cancel: boolean;
        state: string;
    };
}

export type CallValues = {
   [name: string]: string;
}

export type Context = {
    app_id: string;
    acting_user_id?: string;
    user_id?: string;
    channel_id?: string;
    team_id?: string;
    post_id?: string;
    root_id?: string;
    props?: ContextProps;
}

export type ContextProps = {
    [name: string]: string;
}

export type Call = {
    url: string;
    context: Context;
    values?: CallValues;
    as_modal?: boolean;
    raw_command?: string;
    from?: Binding[];
};

export type CallResponse = {
	type: CallResponseType;
    markdown?: string;
	data?: any;
    error?: string;
    url?: string;
	use_external_browser?: boolean;
    call?: Call;
}

export type Binding = {
    app_id: string;
    location_id: string;
    icon?: string;
    label?: string;
    hint?: string;
    description?: string;
    role_id?: string;
    depends_on_team: boolean;
    depends_on_channel: boolean;
    depends_on_user: boolean;
    depends_on_post: boolean;
    call?: Call;
    bindings?: Binding[];
}
