// ADMIN ++++++++++++++++++++++++++++++++++++++++++
export const admin = {
    workspace: { view: true, create: true, update: true, delete: true, invite: true, tag: true, userGroups: true },
    dataCollections: [],
    views: [],
    docs: { view: true, create: true, update: true, delete: true, tag: true },
    chat: { view: true, create: true },
}

export const adminDataCollection = {
    dataCollection: { view: true, update: true, delete: true, tag: true },
    rows: { reorder: true, create: true, delete: true, subrows: true },
    notes: { view: true, create: true },
    reminders: { view: true },
    docs: { view: true, create: true, update: true, delete: true },
    columns: []
}

export const adminView = {
    view: { view: true, update: true, delete: true },
    rows: { reorder: true, create: true, delete: true, subrows: true },
    notes: { view: true, create: true },
    reminders: { view: true },
    docs: { view: true, create: true, update: true, delete: true },
    columns: []
}

export const adminColumns = {
    column: { view: true, update: true, delete: true, reorder: true, resize: true }
}

// VIEW ONLY +++++++++++++++++++++++++++++++++++++++++++++++++++++
export const viewOnly = {
    workspace: { view: true, create: false, update: false, delete: false, invite: false, tag: false, userGroups: false },
    dataCollections: [],
    views: [],
    docs: { view: true, create: false, update: false, delete: false, tag: false },
    chat: { view: true, create: true },
}

export const viewOnlyDataCollection = {
    dataCollection: { view: true, update: false, delete: false, tag: false },
    rows: { reorder: false, create: false, delete: false, subrows: false },
    notes: { view: true, create: false },
    reminders: { view: true },
    docs: { view: true, create: false, update: false, delete: false },
    columns: []
}

export const viewOnlyView = {
    view: { view: true, update: false, delete: false },
    rows: { reorder: false, create: false, delete: false, subrows: false },
    notes: { view: true, create: false },
    reminders: { view: true },
    docs: { view: true, create: false, update: false, delete: false },
    columns: []
}

export const viewOnlyColumns = {
    column: { view: true, update: false, delete: false, reorder: false, resize: false }
}

export const emptyDataCollectionPermissions = {
    dataCollection: { view: false, update: false, delete: false, tag: false },
    rows: { reorder: false, create: false, delete: false, subrows: false },
    notes: { view: false, create: false },
    reminders: { view: false },
    docs: { view: false, create: false, update: false, delete: false },
    columns: [],
};

export const emptyViewPermissions = {
    view: { view: false, update: false, delete: false },
    rows: { reorder: false, create: false, delete: false, subrows: false },
    notes: { view: false, create: false },
    reminders: { view: false },
    docs: { view: false, create: false, update: false, delete: false },
    columns: [],
};

export const emptyColumnPermissions = {
    column: { view: false, update: false, delete: false, reorder: false, resize: false },
};
