export type TProps = {
    workspaces: any;
    setWorkspaces: any;
};

export type TUser = {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    workspaces: string[];
};

export type TWorkspace = {
    _id: string;
    name: string;
    description: string;
    tools: TTools;
    invitees: TInvitee[];
};

export type TInvitee = {
    email: string;
    permissions: number;
};

export type TDataCollection = {
    _id?: string;
    name: string;
    workspace: string;
    form: TForm;
    columns: string[];
    rows: string[];
};

export type TColumn = {
    _id?: string;
    dataCollectionId: string;
    name: string;
    type: string;
    permanent: boolean;
    people?: string[];
    labels?: TLabel[];
    includeInForm: boolean;
    includeInExport: boolean;
    primary: boolean;
};

export type TRow = {
    _id?: string;
    dataCollectionId: string;
    cells: string[];
};

export type TCell = {
    _id: string;
    rowId: string;
    name: string;
    type: string;
    position: number;
    people?: string[];
    labels?: TLabel[];
    value: string;
};

export type TLabel = {
    title: string;
    color: string;
};

export type TTableData = any;

export type TForm = {
    active: boolean;
    type: string;
    emails: string[];
};

export type TTools = {
    dataCollections: TAccess;
    taskLists: TAccess;
    docs: TAccess;
    messageBoard: TAccess;
};

export type TAccess = {
    access: number;
};