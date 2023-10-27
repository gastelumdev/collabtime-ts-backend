import mongoose from "mongoose";

const connectDB = async (URI: string) => {
    try {
        const connection = await mongoose.connect(URI);
        console.log(`Mongo db connected: ${connection.connection.host}`)
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
    
}

export default connectDB;