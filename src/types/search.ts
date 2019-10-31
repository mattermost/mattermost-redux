// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export type Search = {
    terms: string;
    isOrSearch: boolean;
};
export type SearchState = {
    current: any;
    results: Array<string>;
    recent: {
        [x: string]: Array<Search>;
    };
    matches: {
        [x: string]: Array<string>;
    };
};
