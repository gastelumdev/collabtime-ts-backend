import { Schema, model } from "mongoose";
import { IUser, IUserDocument, IUserModel } from "../services/auth.service"
import * as authService from "../services/auth.service";

const userSchema: Schema<IUserDocument> = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["general", "admin", "superuser"] },
    organization: { type: String },
    logoURL: { type: String, default: "https://collabtime-ts-backend.onrender.com/docs/logo_551aecd0-c608-11ee-b41a-e97b0c5f0d41.png" },
    workspaces: [],
    created_at: { type: Date, default: Date.now },
});

// userSchema.pre("save", async function (this: IUserDocument, next: Function) {
//     if (!this.isModified("password")) {
//         return next();
//     }

//     const hash = await bcrypt.hash(this.password, Number(10));
//     this.password = hash;
//     next();
// })

userSchema.statics.buildUser = (args: IUser) => {
    return new User(args);
}

const User = model<IUserDocument, IUserModel>("users", userSchema);

export default User;

/**
 * Retrieves a user by their ID.
 *
 * This function fetches a single user document from the database 
 * that matches the provided user ID. It uses the `User.findById` method to perform the query.
 *
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object if found,
 *                                    or null if no user matches the ID.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const getUserById = async (id: string) => {
    const user = await User.findById(id);
    return user;
}

/**
 * Retrieves a user by their email.
 *
 * This function fetches a single user document from the database 
 * that matches the provided email address. It uses the `User.findOne` method to perform the query.
 *
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object if found,
 *                                    or null if no user matches the email.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const getUserByEmail = async (email: string) => {
    const user = await User.findOne({ email });
    return user;
}

/**
 * Removes a workspace from a user's list of workspaces and updates the user object.
 *
 * This function removes the specified workspace from the user's list of workspaces,
 * then updates the user document in the database with the modified list.
 *
 * @param {string} workspaceId - The ID of the workspace to be removed from the user's list.
 * @param {IUser} user - The user object whose workspace list is being updated.
 * @returns {Promise<Object|null>} - A promise that resolves to the updated user object if successful,
 *                                    or null if the user was not found.
 *
 * @note This function is not part of automated testing and needs to have automated tests implemented.
 */
export const removeWorkspaceFromUser = async (workspaceId: string, user: IUser) => {
    // Filter out the workspace being deleted
    const userWorkspaces = authService.removeWorkspaceFromUser(workspaceId, user);
    // Update the owner's workspaces with the new filtered workspaces
    const updatedUser = await User.findOneAndUpdate({ _id: user?._id }, { workspaces: userWorkspaces }, { new: true });
    return updatedUser;
}
