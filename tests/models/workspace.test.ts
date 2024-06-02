import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';
import { newWorkspace } from "../data";
import Workspace, { getWorkspaceById } from "../../models/workspace.model";

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;
let accessToken: any;
let createdWorkspace: any;

const baseURL = process.env.APP_URL as string;

describe("Workspaces models", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        const userRes = await request(baseURL).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        user = userRes.body.user;
        accessToken = userRes.body.accessToken;

        newWorkspace.owner = user._id
        createdWorkspace = new Workspace(newWorkspace);
        createdWorkspace.save();
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
        try {
            console.log(accessToken)
            const req = await request(baseURL).post(`/workspaces/delete/${createdWorkspace._id.toString()}/`).set('Accept', 'application/json').set('Authorization', `JWT ${accessToken}`);
        } catch (err) {
            console.log(err)
        }

    });

    describe("getWorkspaceById", () => {
        it("should return a workspace with the same id as the one provided", async () => {

            const testWorkspace = await getWorkspaceById(createdWorkspace._id);
            expect(testWorkspace?._id.toString()).toBe(createdWorkspace._id.toString());
        })
    })
})