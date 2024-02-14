import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv"
dotenv.config({
    path: "../.env"
})

import MONGODB_URI from "dotenv"

const connectDB = async () =>{

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Congratulations You have connected your first database \nMongoDB connected !! DB ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MONGO DB CONNECTION ERROR OR FAILED GO TO DB FILE: ", error );
        process.exit(1)

    }
}


export default connectDB
