// @flow

export type SchemeScope = 'team' | 'channel';

export type Scheme = {
    id: string,
    name: string,
    description: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    scope: SchemeScope,
    default_team_admin_role: string,
    default_team_user_role: string,
    default_channel_admin_role: string,
    default_channel_user_role: string,
};

export type SchemesState = {
    schemes: { [string]: Scheme },
};

export type SchemePatch = {
  name?: string,
  description?: string
};