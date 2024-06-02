import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';
import { addWorkspaceToUser, createNewWorkspace, getUserWorkspaces } from "../../services/workspace.service";
import User from "../../models/auth.model";
import { newWorkspace } from "../data";

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;
let accessToken: any;

const baseURL = process.env.APP_URL as string;
let createdWorkspace: any = null;


describe("Workspace service", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        const userRes = await request(baseURL).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
        user = userRes.body.user;
        accessToken = userRes.body.accessToken;
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
    });

    describe("getUserWorkspaces fuction", () => {
        it("should return the same amount of workspaces as the ids passed in", async () => {
            const usersWorkspaces = await getUserWorkspaces(user.workspaces);
            expect(usersWorkspaces.length).toBe(user.workspaces.length);
        })
    })

    describe("createNewUser function", () => {
        beforeAll(async () => {
            await mongoose.connect(mongodb_uri);
            // user = await request(baseURL).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
            newWorkspace.owner = user._id;
            createdWorkspace = await createNewWorkspace(newWorkspace, user);
        })
        afterAll(async () => {
            if (createdWorkspace) {
                await request(baseURL).post(`/workspaces/delete/${createdWorkspace._id.toString()}/`).set('Accept', 'application/json').set('Authorization', `JWT ${accessToken}`);
                await mongoose.connection.close();
            }
        })

        it("should have an id", async () => {
            expect(createdWorkspace._id !== undefined).toBe(true);
        })

        it("should match the provided workspace", async () => {
            expect(createdWorkspace.name).toBe(newWorkspace.name);
        })

        it("should add the user to workspace members", async () => {
            const member = createdWorkspace.members[0];
            expect(member.email).toBe(user.email);
        })
    })

    describe("addWorkspaceToUser function", () => {
        let updatedUser: any = null;
        beforeAll(async () => {
            await mongoose.connect(mongodb_uri);
            // user = await request(baseURL).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
            newWorkspace.owner = user._id;
            createdWorkspace = await createNewWorkspace(newWorkspace, user);
            updatedUser = await addWorkspaceToUser(createdWorkspace, user);
        })
        afterAll(async () => {
            if (createdWorkspace) {
                await request(baseURL).post(`/workspaces/delete/${createdWorkspace._id.toString()}/`).set('Accept', 'application/json').set('Authorization', `JWT ${accessToken}`);
                await mongoose.connection.close()
            }
        })

        it("should add the workspace to the users workspaces", async () => {
            expect(updatedUser.workspaces[updatedUser.workspaces.length - 1].id.toString()).toBe(createdWorkspace._id.toString());
        })
    })
})