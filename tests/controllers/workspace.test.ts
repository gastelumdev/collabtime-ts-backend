import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';
import { IUser } from "../../services/auth.service";

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;

const baseURL = process.env.APP_URL as string;

describe("Workspaces", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        user = await request(baseURL).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
    });


    describe("Get all a user's workspaces", () => {
        describe("given the user is logged in and the workpaces exist", () => {
            it("should return all workspaces", async () => {
                const res = await request(baseURL).get(`/workspaces`).set('Accept', 'application/json').set('Authorization', `JWT ${user.body.accessToken}`);

                expect(res.statusCode).toBe(200);
            })
        })
    })
})