import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';
import { createNewWorkspace, getUserWorkspaces } from "../../services/workspace.service";

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;

const baseURL = process.env.APP_URL as string;
let createdWorkspace: any = null;

describe("Workspace service", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        user = await request(baseURL).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
        console.log({ createdWorkspace });

        if (createdWorkspace) {
            await request(baseURL).post(`/workspaces/delete/${createdWorkspace._id.toString()}/`).set('Accept', 'application/json').set('Authorization', `JWT ${user.body.accessToken}`);
        }


    });
    describe("Get user workspaces", () => {
        it("should return the same amount of workspaces as the ids passed in", async () => {
            const usersWorkspaces = await getUserWorkspaces(user.body.user.workspaces);
            expect(usersWorkspaces.length).toBe(user.body.user.workspaces.length);
        })
    })

    describe("Create new user", () => {
        it("should create a new user", async () => {
            const newWorkspace = {
                name: "Test Workspace",
                description: "",
                tools: {
                    dataCollections: {
                        access: 2
                    },
                    taskLists: {
                        access: 2
                    },
                    docs: {
                        access: 2
                    },
                    messageBoard: {
                        access: 2
                    }
                },
                invitees: [],
                members: [],
                owner: user._id,
                workspaceTags: [],
                tags: [],
                createdAt: null
            }
            createdWorkspace = await createNewWorkspace(newWorkspace, user);

            expect(createdWorkspace._id !== undefined).toBe(true);
            expect(createdWorkspace.name).toBe(newWorkspace.name)
        })
    })
})