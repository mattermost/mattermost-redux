// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {Files} from 'constants';
import mimeDB from 'mime-db';

export function getFormattedFileSize(file) {
    const bytes = file.size;
    const fileSizes = [
        ['TB', 1024 * 1024 * 1024 * 1024],
        ['GB', 1024 * 1024 * 1024],
        ['MB', 1024 * 1024],
        ['KB', 1024]
    ];
    const size = fileSizes.find((unitAndMinBytes) => {
        const minBytes = unitAndMinBytes[1];
        return bytes > minBytes;
    });
    if (size) {
        return `${Math.floor(bytes / size[1])} ${size[0]}`;
    }
    return `${bytes} B`;
}

export function getFileType(file) {
    const fileExt = file.extension.toLowerCase();
    const fileTypes = [
        'image',
        'code',
        'pdf',
        'video',
        'audio',
        'spreadsheet',
        'word',
        'presentation',
        'patch'
    ];
    return fileTypes.find((fileType) => {
        const constForFileTypeExtList = `${fileType}_types`.toUpperCase();
        const fileTypeExts = Files[constForFileTypeExtList];
        return fileTypeExts.indexOf(fileExt) > -1;
    }) || 'other';
}

let extToMime;
function buildExtToMime() {
    extToMime = {};
    Object.keys(mimeDB).forEach((key) => {
        const mime = mimeDB[key];
        if (mime.extensions) {
            mime.extensions.forEach((ext) => {
                extToMime[ext] = key;
            });
        }
    });
}

export function lookupMimeType(filename) {
    if (!extToMime) {
        buildExtToMime();
    }

    const ext = filename.split('.').pop();

    return extToMime[ext] || 'application/octet-stream';
}

export function parseClientIdsFromFormData(formdata) {
    const parts = formdata._parts; // eslint-disable-line
    const index = parts.findIndex((p) => p[0] === 'client_ids');

    const clientIds = parts[index];
    clientIds.shift();

    return clientIds;
}
