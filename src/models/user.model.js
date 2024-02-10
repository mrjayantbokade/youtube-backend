import mongoose, { trusted } from "mongoose";
import { Schema } from "mongoose";
import bcrypt from "bcrypt"
import { Jwt } from "jsonwebtoken";
import dotenv from "dotenv"

dotenv.config({
    path: "./env"
    
})

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

    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },

    avatar:{
        type: String, //cloudinary url
        reqired: true,

    },
    coverImage:{
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


userSchema.pre("save", async function(next){
    // if(this.isModified("password")){
    //     this.password = bcrypt.hash(this.password, 10)
    //     next()
    // }else{
    //     next()
    // }


    // same logic but way is different
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id: this._id,
           

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH__TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)