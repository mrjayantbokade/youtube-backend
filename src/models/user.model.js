import mongoose, { trusted } from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema({
   
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],

    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },

    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },

    avatar:{
        type: String, //cloudinary url
        reqired: true,

    },
    coverimage:{
        type: String,
    },
    password:{
        type: String,
        required: [true, "Password is required"]

    },

    refreshToken:{
        type: String
    }


}, {timestamps: true})


export const User = mongoose.model("User", userSchema)