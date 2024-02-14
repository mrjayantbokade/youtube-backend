import { error, log } from "console"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { existsSync } from "fs"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import  {upload}  from "../middlewares/multer.middleware.js"
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
    // console.log("email:", email);
    // console.log("password:", password);

    // console.log("This is req.body log");
    // console.log(req.body);

    if(
        [fullName, email, username, password].some((field) => {
             return field?.trim() === ""
        })
    ){
        throw new ApiError(400, "All fields are required while registering")
    }


    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
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

} )



const loginUser = asyncHandler(async(req, res) => {
    res.status(200).json({
        message:"Its a success",
        statusCode: 200,
        name: "Jayant Bokade"

    })


})

export { registerUser, loginUser }