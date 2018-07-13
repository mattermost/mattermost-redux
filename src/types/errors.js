// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

type ErrorOffline = {|
  message: string,
  url: string
|}

type ErrorInvalidResponse = {|
  intl: {
    id: string,
    defaultMessage: string
  }
|}

type ErrorApi = {|
  message: string,
  server_error_id: string,
  status_code: number,
  url: string
|}

export type Client4Error = ErrorOffline | ErrorInvalidResponse | ErrorApi;
