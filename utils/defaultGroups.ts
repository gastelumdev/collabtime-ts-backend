export const admin = {
    workspace: { view: true, create: true, update: true, delete: true, invite: true, tag: true, userGroups: true },
    dataCollections: [],
    views: [],
    docs: { view: true, create: true, update: true, delete: true, tag: true },
    chat: { view: true, create: true },
    users: []
}

export const viewOnly = {
    workspace: { view: true, create: false, update: false, delete: false, invite: false, tag: false, userGroups: false },
    dataCollections: [],
    views: [],
    docs: { view: true, create: false, update: false, delete: false, tag: false },
    chat: { view: true, create: true },
    users: []
}