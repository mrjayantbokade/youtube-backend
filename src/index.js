// require('dotenv').config({path: './env'})
// we cant use this statement
// or importing method because we are using module 


import dotenv from "dotenv"
import { config } from "dotenv"
import {DB_NAME} from "./constants.js"
import connectDB from "./db/dbConnection.js"
import express from "express"

dotenv.config({
    path: "./env"
})


const app = express()

connectDB()
.then(() =>{

    app.get('/', (req, res) =>{
        res.send("hello")
    })

    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Application is running on http://localhost:${process.env.PORT}`);
    } )
})

.catch((err) =>{
    console.log("Database response Error go to index.js or deeper");
})





