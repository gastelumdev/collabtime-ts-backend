import mongoose from "mongoose";
import Logger from "../utils/logger/Logger";

const logger = new Logger()

const connectDB = async (URI: string) => {
    try {
        const connection = await mongoose.connect(URI);
        logger.info(`Database connected successfully`)
    } catch (error) {
        logger.error(`There was an error connecting to the database: ${error}`);
        process.exit(1);
    }

}

export default connectDB;