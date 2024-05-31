import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';
import { getUserWorkspaces } from "../../services/workspace.service";

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;

describe("Workspace service", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        user = await request(app).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
    });
    describe("Get user workspaces", () => {
        it("should return the same amount of workspaces as the ids passed in", async () => {
            const usersWorkspaces = await getUserWorkspaces(user.body.user.workspaces);
            expect(usersWorkspaces.length).toBe(user.body.user.workspaces.length);
        })
    })
})