// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelModerationRoles} from 'types/roles';
import {Dictionary} from 'types/utilities';

const Roles: Dictionary<ChannelModerationRoles> = {
    MEMBERS: 'members',
    GUESTS: 'guests',
    ADMINS: 'admins',
};

export default Roles;
