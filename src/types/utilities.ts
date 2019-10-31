// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export type $ID<E extends {id}> = E['id'];
export type $UserID<E extends {user_id}> = E['user_id'];
export type $Name<E extends {name}> = E['name'];
export type $Username<E extends {username}> = E['username'];
export type $Email<E extends {email}> = E['email'];
export type RelationOneToOne<E extends {id}, T> = {
    [x in $ID<E>]: T;
};
export type RelationOneToMany<E1 extends {id}, E2 extends {id}> = {
    [x in $ID<E1>]: Array<$ID<E2>>;
};
export type IDMappedObjects<E extends {id}> = RelationOneToOne<E, E>;
export type UserIDMappedObjects<E extends {user_id}> = {
    [x in $UserID<E>]: E;
};
export type NameMappedObjects<E extends {name}> = {
    [x in $Name<E>]: E;
};
export type UsernameMappedObjects<E extends {username}> = {
    [x in $Username<E>]: E;
};
export type EmailMappedObjects<E extends {email}> = {
    [x in $Email<E>]: E;
};

export type Dictionary<T> = {
    [key: string]: T;
};