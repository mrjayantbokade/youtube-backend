import { error, log } from "console"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { existsSync } from "fs"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"
import {ApiResponse} from "../utils/ApiResponse.js";



const registerUser = asyncHandler( async (req, res) => {
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


    const {fullName, email, username, password } = req.body
    console.log("email:", email);
    console.log("password:", password);

    if(
        [fullName, email, username, password].some((eachFromThisLeftArray) => {
            eachFromThisLeftArray?.trim() === ""
        })
    ){
        throw new ApiError(400, "All fields are required while registering")
    }


    const existedUser = User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exist")
    }


   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(!avatarLocalPath){
    throw new ApiError(400, "avatar file is required")
   }


   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
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

    const createdUser = await user.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Server Error: Error occured while registering user ")
        
    }


    //beginner
    // const response = ApiResponse(200, createdUser, "User Created and this is this data")

    // pro
    return res.status(201).json(
        
            new ApiResponse(200, createdUser, "USER CREATED SUCCESSFULLY"),
        
    )

} )



const loginUser = asyncHandler(async(req, res) => {
    res.status(200).json({
        message:"Its a success",
        statusCode: 200,
        name: "Jayant Bokade"

    })


})

export { registerUser, loginUser }