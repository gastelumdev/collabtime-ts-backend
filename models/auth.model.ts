import {Schema, model} from "mongoose";
import { IUser, IUserDocument, IUserModel} from "../services/auth.service"
import bcrypt from "bcrypt";

const userSchema: Schema<IUserDocument> = new Schema({
    firstname: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, enum: ["general", "admin", "superuser"], required: true},
    workspaces: [String],
    created_at: {type: Date, default: Date.now},
});

userSchema.pre("save", async function (this: IUserDocument, next: Function) {
    if (!this.isModified("password")) {
        return next();
    }

    const hash = await bcrypt.hash(this.password, Number(10));
    this.password = hash;
    next();
})

userSchema.statics.buildUser = (args: IUser) => {
    return new User(args);
}

const User = model<IUserDocument, IUserModel>("users", userSchema);

export default User;

console.log(User)

