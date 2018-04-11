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
    defaultteamadminrole: string,
    defaultteamuserrole: string,
    defaultchanneladminrole: string,
    defaultchanneluserrole: string,
};

export type SchemesState = {
    schemes: { [string]: Scheme },
};

export type SchemePatch = {
  name?: string,
  description?: string
};