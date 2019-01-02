// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type $ID<E> = $PropertyType<E, 'id'>
export type $UserID<E> = $PropertyType<E, 'user_id'>
export type $Name<E> = $PropertyType<E, 'name'>
export type $Username<E> = $PropertyType<E, 'username'>
export type $Email<E> = $PropertyType<E, 'email'>

export type RelationOneToOne<E, T> = { [$ID<E>]: T }
export type RelationOneToMany<E1, E2> = { [$ID<E1>]: Array<$ID<E2>> }
export type IDMappedObjects<E> = RelationOneToOne<E, E>
export type UserIDMappedObjects<E> = { [$UserID<E>]: E }
export type NameMappedObjects<E> = { [$Name<E>]: E }
export type UsernameMappedObjects<E> = { [$Username<E>]: E }
export type EmailMappedObjects<E> = { [$Email<E>]: E }
