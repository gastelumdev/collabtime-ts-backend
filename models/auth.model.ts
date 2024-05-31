import { Schema, model } from "mongoose";
import { IUser, IUserDocument, IUserModel } from "../services/auth.service"
import bcrypt from "bcrypt";

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

export const getUserById = async (id: string) => {
    const user = await User.findById(id);
    return user;
}

