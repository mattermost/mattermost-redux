// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type AppsState = {
    bindings: AppBinding[];
};

export type AppBinding = {
    app_id: string;
    location_id?: string;
    icon?: string;

    // Label is the (usually short) primary text to display at the location.
    // - For LocationPostMenu is the menu item text.
    // - For LocationChannelHeader is the dropdown text.
    // - For LocationCommand is the name of the command
    label: string;

    // Hint is the secondary text to display
    // - LocationPostMenu: not used
    // - LocationChannelHeader: tooltip
    // - LocationCommand: the "Hint" line
    hint?: string;

    // Description is the (optional) extended help text, used in modals and autocomplete
    description?: string;

    role_id?: string;
    depends_on_team?: boolean;
    depends_on_channel?: boolean;
    depends_on_user?: boolean;
    depends_on_post?: boolean;

    // A Binding is either to a Call, or is a "container" for other locations -
    // i.e. menu sub-items or subcommands.
    call?: AppCall;
    bindings?: AppBinding[];
    form?: AppForm;
};

export type AppCallValues = {
    [name: string]: string;
};

export type AppCallType = string;

export const AppCallTypes: { [name: string]: AppCallType } = {
    SUBMIT: '',
    FORM: 'form',
    CANCEL: 'cancel',
};

export type AppCall = {
    url: string;
    type: string;
    values?: AppCallValues;
    context: AppContext;
    raw_command?: string;
    expand?: AppExpand;
};

export type AppCallResponseType = string;

export const AppCallResponseTypes: { [name: string]: AppCallResponseType } = {
    OK: '',
    ERROR: 'error',
    FORM: 'form',
    CALL: 'call',
    NAVIGATE: 'navigate',
};

export type AppCallResponse<Res = {}> = {
    type: AppCallResponseType;
    markdown?: string;
    data?: Res;
    error?: string;
    url?: string;
    use_external_browser?: boolean;
    call?: AppCall;
};

export type AppContext = {
    app_id: string;
    location_id?: string;
    acting_user_id?: string;
    user_id?: string;
    channel_id?: string;
    team_id?: string;
    post_id?: string;
    root_id?: string;
    props?: AppContextProps;
};

export type AppContextProps = {
    [name: string]: string;
};

export type AppExpandLevel = string;

export const AppExpandLevels: { [name: string]: AppExpandLevel } = {
    EXPAND_ALL: 'All',
    EXPAND_SUMMARY: 'Summary',
};

export type AppExpand = {
    app?: AppExpandLevel;
    acting_user?: AppExpandLevel;
    channel?: AppExpandLevel;
    config?: AppExpandLevel;
    mentioned?: AppExpandLevel;
    parent_post?: AppExpandLevel;
    post?: AppExpandLevel;
    root_post?: AppExpandLevel;
    team?: AppExpandLevel;
    user?: AppExpandLevel;
};

export type AppForm = {
    title?: string;
    header?: string;
    footer?: string;
    icon?: string;
    submit_buttons?: string;
    cancel_button?: boolean;
    submit_on_cancel?: boolean;
    fields: AppField[];
    depends_on?: string[];
};

export type AppSelectOption = {
    label: string;
    value: string;
    icon_data?: string;
};

export type AppFieldType = string;

export const AppFieldTypes: { [name: string]: AppFieldType } = {
    TEXT: 'text',
    STATIC_SELECT: 'static_select',
    DYNAMIC_SELECT: 'dynamic_select',
    BOOL: 'bool',
    USER: 'user',
    CHANNEL: 'channel',
};

// This should go in mattermost-redux
export type AppField = {

    // Name is the name of the JSON field to use.
    name: string;
    type: AppFieldType;
    is_required?: boolean;

    // Present (default) value of the field
    value?: string;

    description: string;

    label?: string;
    hint?: string;
    position?: number;

    modal_label?: string;

    // Select props
    refresh_on_change_to?: string[];
    source_url?: string;
    options?: AppSelectOption[];

    // Text props
    subtype?: string;
    min_length?: number;
    max_length?: number;
};
