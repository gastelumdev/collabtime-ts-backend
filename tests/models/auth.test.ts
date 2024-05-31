import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';
import { getUserById } from "../../models/auth.model";
import { TUser } from "../../types"

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;

describe("Auth model", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        user = await request(app).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
    });
    describe("get user by id", () => {
        it("should match the id passed in", async () => {
            const userFromModel = await getUserById(user.body.user._id);
            expect(userFromModel?._id.toString()).toBe(user.body.user._id);
        })
    })
})