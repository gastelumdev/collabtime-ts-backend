import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import dotenv from 'dotenv';

dotenv.config();
const mongodb_uri = process.env.MONGODB_URI || "";
let user: any;

describe("Workspaces models", () => {
    /* Connecting to the database before each test. */
    beforeEach(async () => {
        await mongoose.connect(mongodb_uri);
        user = await request(app).post(`/login`).send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD })
    });

    /* Closing database connection after each test. */
    afterEach(async () => {
        await mongoose.connection.close();
    });

    it("Should return true", () => {
        expect(true).toBe(true)
    })
})