// @flow

export type Search = {
    terms: string,
    isOrSearch: boolean
}

export type SearchState = {
    results: Array<string>,
    recent: {[string]: Array<Search>}
};
