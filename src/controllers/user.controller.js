import { error, log } from "console"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { existsSync } from "fs"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import  {upload}  from "../middlewares/multer.middleware.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import bodyParser from "body-parser"



const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        // console.log("INSIDE GENERATE ASSCESS AND REFRESH TOKENS AND USER PRINTING VIA ._ID",user);
        const accesstoken = user.generateAccessToken()
        // console.log("ACCESS TOKEN" , accesstoken);

        const refreshtoken = user.generateRefreshToken()
        // console.log("REFRESH TOKEN" , refreshtoken);

        // initially refresh token was empty come with register response but we have to update here cause it is a object 

        user.refreshToken = refreshtoken

        // console.log("refreshtoken re-assigned" , user.refreshToken);

        await user.save({ validateBeforeSave: false })
        // console.log("SAVED USER" , user);


        // console.log("ACCESS TOKEN" , accesstoken);


        // console.log("RETURNNING BOTH");
        return { accesstoken, refreshtoken }


    } catch (error) {

        throw new ApiError(500, "something went wrong while generating access tokens")
    }
}

    const registerUser = asyncHandler(async (req, res) => {
        // res.status(200).json({
        //     message: "ok",
        // })

        // get user details from frontend
        // validation - not empty
        // check if user already exists: username, email
        // check for images, check for avatar
        // create user object - create entry in db .create
        // remove password and refresh token from field from response
        // check for user creation 
        // return response


        const { fullName, email, username, password } = req.body
        // console.log("email:", email);
        // console.log("password:", password);

        // console.log("This is req.body log");
        // console.log(req.body);

        if (
            [fullName, email, username, password].some((field) => {
                return field?.trim() === ""
            })
        ) {
            throw new ApiError(400, "All fields are required while registering")
        }


        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existedUser) {
            throw new ApiError(409, "User with username or email already exist")
        }


        // console.log("This is req.files log");
        // console.log(req.files);

        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;
        let coverImageLocalPath;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.lenght > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "avatar file is required")
        }


        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar) {
            throw new ApiError(400, "avatar file is required")

        }



        const user = await User.create(
            {
                fullName,
                avatar: avatar.url,
                coverImage: coverImage?.url || "",
                email,
                password,
                username: username.toLowerCase()
            }
        )

        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        if (!createdUser) {
            throw new ApiError(500, "Server Error: Error occured while registering user ")
        
        }


        //beginner
        // const response = ApiResponse(200, createdUser, "User Created and this is this data")

        // pro
        return res.status(201).json(
        
            new ApiResponse(200, createdUser, "USER CREATED SUCCESSFULLY"),
        
        )

    })




    //loginUser
    const loginUser = asyncHandler(async (req, res) => {
        // take username/email and password from user
        // check if user exists
        // if it is then check for passwordd
        // if password is correct then return user
        // if password is incorrect then return error
        // check username and email and password in User.model.js
        // then route user to dashboard or home page

        const {email, username, password} = req.body
        console.log(email, username, password);

        // const username = "fourthusername"
        // const password = "fourthpass"
        // const email = "fourthemail"




    

        if (!username && !email) {
            throw new ApiError(400, "username or email is required")
        }

        // noob
        //  if (username || email && password) {
        //
        // }
        // const existedUser = await User.findOne({
        //     $or: [{ username }, { email }]
        // })

        const user = await User.findOne({
            $or: [{username}, {email}]
        })

      
    
    

        // const user = await User.findOne(username)
        // console.log(user);

        if (!user) {
            throw new ApiError(404, "user not found")
        }


        // console.log(user.password);
        
        const isPasswordValid = await user.isPasswordCorrect(password)

        console.log(isPasswordValid);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials")
        }


        //because generateAccessAndRefreshToken() returns an two object values
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
        const loggedInUser = await User.findById(user._id)
            // .select("-password -refreshToken")

        const options = {
            httpOnly: false,
            secure: false
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged in successfully"
                )
            )


    })

    const logoutUser = asyncHandler(async (req, res) => {

        await User.findByIdAndUpdate(
            req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"))
        
        
    })





   

    export {
        registerUser,
        loginUser,
        logoutUser
    }