## `IWorkspace` Interface

### Description

Defines the structure of a workspace object.

### Properties

- `name` (`string`): The name of the workspace.
- `description?` (`string`, optional): A description of the workspace.
- `tools` (`TTools`): An object defining the access levels for various tools within the workspace.
- `invitees` (`TInvitee[]`): An array of invitee objects, each containing email and permissions information.
- `members` (`TInvitee[]`): An array of member objects, each containing email and permissions information.
- `owner` (`Schema.Types.ObjectId`): The ID of the user who owns the workspace.
- `workspaceTags` (`ITag[]`): An array of tags associated with the workspace.
- `tags` (`ITag[]`): An array of general tags.
- `createdAt` (`Date | null`): The date the workspace was created, or null if not set.

</br>

## `IWorkspaceDocument` Interface

### Description

Extends the `IWorkspace` interface to include `Document` properties and methods from Mongoose.

### Properties

Inherits all properties from `IWorkspace` and `Document`.

</br>

## `IWorkspaceModel` Interface

### Description

Extends the `Model` interface from Mongoose to include a custom method for building workspace documents.

### Methods

- `buildWorkspace(args: IWorkspace): IWorkspaceDocument`: Creates and returns a new `IWorkspaceDocument` based on the provided `IWorkspace` object.

</br>

## `TAccess` Type

### Description

Defines the structure for access levels within a workspace tool.

### Properties

- `access` (`number`): The access level.

</br>

## `TTools` Type

### Description

Defines the access levels for various tools within a workspace.

### Properties

- `dataCollections` (`TAccess`): Access level for data collections.
- `taskLists` (`TAccess`): Access level for task lists.
- `docs` (`TAccess`): Access level for documents.
- `messageBoard` (`TAccess`): Access level for the message board.

</br>

## `TInvitee` Type

### Description

Defines the structure for an invitee or member of a workspace.

### Properties

- `email` (`string`): The email of the invitee or member.
- `permissions` (`number`): The permissions level of the invitee or member.

</br>

## Imports

### Modules

- `Document`, `Schema`, `Model` from `"mongoose"`
- `ITag` from `"./tag.service"`
- `Workspace` from `"../models/workspace.model"`
- `IUser`, `IUserWorkspace` from `"./auth.service"`
- `TUser`, `TWorkspace` from `"../types"`
- `User` from `"../models/auth.model"`

</br>

## `getUserWorkspaces`

### Description

This asynchronous function retrieves workspace documents from the database based on an array of user workspace objects.

### Parameters

- `userWorkspaceObjects` (`IUserWorkspace[]`): An array of objects containing user workspace details, each object includes an `id` property representing the workspace ID.

### Returns

- `Promise<Workspace[]>`: A promise that resolves to an array of workspace documents.

### Code

```typescript
/**
 * This asynchronous function retrieves workspace documents from the database
 * based on an array of user workspace objects.
 * 
 * @param {IUserWorkspace[]} userWorkspaceObjects - An array of objects containing user workspace details, 
 *        each object includes an `id` property representing the workspace ID.
 * 
 * @returns {Promise<Workspace[]>} - A promise that resolves to an array of workspace documents.
 */
export const getUserWorkspaces = async (userWorkspaceObjects: IUserWorkspace[]) => {
    const workspaces = [];
    for (const userWorkspaceObject of userWorkspaceObjects) {
        const workspace = await Workspace.findOne({ _id: userWorkspaceObject.id });
        workspaces.push(workspace);
    }
    return workspaces;
}
```