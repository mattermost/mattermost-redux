// @flow

export type CustomEmoji = {
    id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    creator_id: string,
    name: string
}

export type EmojisState = {
    customEmoji: {
        [string]: CustomEmoji
    },
    nonExistentEmoji: Set<string>
};
