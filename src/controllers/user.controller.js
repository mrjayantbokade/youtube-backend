import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {upload} from "../middlewares/multer.middleware.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import {v2 as cloudinary} from "cloudinary"


const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        // console.log("INSIDE GENERATE ASSCESS AND REFRESH TOKENS AND USER PRINTING VIA ._ID",user);
        const accessToken = user.generateAccessToken()

        // console.log("ACCESS TOKEN" , accessToken);

        const refreshToken = user.generateRefreshToken()
        // console.log("REFRESH TOKEN" , refreshToken);

        // initially refresh token was empty come with register response but we have to update here cause it is a object 

        user.accessToken = accessToken
        user.refreshToken = refreshToken

        // console.log("accesstoken re-assigned" , user.accessToken);
        // console.log("refreshtoken re-assigned" , user.refreshToken);

        await user.save({validateBeforeSave: false})
        // console.log("SAVED USER" , user);


        // console.log("ACCESS TOKEN" , accesstoken);


        // console.log("RETURNNING BOTH");

        return {accessToken, refreshToken}


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


    const {fullName, email, username, password} = req.body
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
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with username or email already exist")
    }


    // console.log("This is req.files log");
    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;

    // if (req.files && Array.isArray(req.files.coverImage) && req.files.lenght > 0) {
        coverImageLocalPath = req.files.coverImage[0]?.path

    // }
    console.log(coverImageLocalPath, "THIS IS COVER IMAGE LOCAL PATH");

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) throw new ApiError(400, "coverImage.url is required")

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


    // console.log(user.username)
    // console.log(user.fullName)
    // console.log(user.avatar.url)
    // console.log(user.avatar)


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
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    console.log(loggedInUser);
    console.log(accessToken);
    console.log(refreshToken);


    const options = {
        httpOnly: true,
        secure: true
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


const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshAccessToken || req.query.refreshAccessToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized")
    }


    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "reFRESH TOKEN IS EXPIRED OR USED")
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )


})


const changeCurrentPassword = asyncHandler(async (req, res) => {

    try {
        const {oldPassword, newPassword} = req.body
        // const initUser = req.user
        // console.log("THIS IS USER IN inituser", initUser)

        // console.log(oldPassword, newPassword)
        const user = await User.findById(req.user?._id).select("-refreshToken")


        // console.log("THIS IS USER IN CHANGECURRENTPASSWORD", user)
        if (!user) {
            new ApiError(401, "User not found")
        }

        const checkOldPassword = await user.isPasswordCorrect(oldPassword)


        if (!checkOldPassword) {
            throw new ApiError(401, "PASSWORD INCORRECT")
        }


        user.password = newPassword
        await user.save({validateBeforeSave: false})


        //no need of this as in user.model.js we already hash the password
        // await User.findByIdAndUpdate(
        //     user._id,
        //     {
        //         $set:{
        //             password: await bcrypt.hash(newPassword, 10)
        //         }
        //     },
        //     {
        //         new: true
        //     }
        // )


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "PASSWORD CHANGED SUCCESSFULLY"
                )
            )

    } catch (error) {
        throw new ApiError(501, "SOMETHING WENT WRONG WHILE UPDATING PASSWORD")
    }


})


const getCurrentUser = asyncHandler(async (req, res) => {

    // const user = await User.findById(req.user?._id).select("-password -refreshToken")
    // // console.log(user, "CURRENT USER" +
    // //     "CURRENT USER")
    //
    // return res
    //     .status(200)
    //     .json(
    //         new ApiResponse(
    //             200,
    //             {
    //                 user
    //             },
    //             "USER FETCHED SUCCESSFULLY"
    //         )
    //     )


    // better approach
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "USER FETCHED SUCCESSFULLY"
            )
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {


    const {fullName, email} = req.body

    if (!fullName && !email) {
        throw new ApiError(401, "Both Email and Fullname required inorder to update account")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Account Details Updated Successfully"
            )
        )
})


const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar file is missing")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
                {
                    avatar: avatar.url
                }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Avatar Uploaded Successfully"
            )
        )
})


const updateUserCoverImage = asyncHandler(async (req, res) => {


    // console.log("HELLO COVERIMAGE")
    const coverImageLocalPath = req.file?.path
    console.log("HELLO coverImageLocalPath", coverImageLocalPath)




    const userBeforeSave = req.user
    if (!userBeforeSave){
        throw new ApiError(401, "Image not found")
    }

    console.log("COVERIMAGE", userBeforeSave.coverImage)



    // if (!userBeforeSave.coverImage) {
    //     const updatePath = await cloudinary.uploader.destroy(userBeforeSave.coverImage)
    //     console.log(updatePath, "UPDATEPATH")
    // }

    if (userBeforeSave.coverImage) {
        try {
            const deletionResult = await cloudinary.api.delete_resources([`${userBeforeSave.coverImage}`], { type: 'upload', resource_type: 'image' });
            console.log('Deletion Result:', deletionResult);
        } catch (error) {
            console.error('Error during deletion:', error.message);
            // Handle the error as needed (e.g., log, throw, or return a meaningful response)
        }
    }


    if (!coverImageLocalPath) throw new ApiError(400, "CoverImage is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("URL COVERIMAGE", coverImage.url)


    // if (userBeforeSave.coverImage){
    //    // await cloudinary.uploader.destroy(userBeforeSave.coverImage)
    //
    //     // await cloudinary.uploader.destroy(userBeforeSave.coverImage, function(error, result) {
    //     //     if (error) {
    //     //         console.error(error);
    //     //     } else {
    //     //         console.log(result);
    //     //     }
    //     // });
    //
    //
    //     await cloudinary.v2.api
    //         .delete_resources([`${userBeforeSave.coverImage}`],
    //             { type: 'upload', resource_type: 'auto' })
    //         .then(console.log);
    // }




    if (!coverImage.url) throw new ApiError(400, "CoverImage is missing")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
                {
                    coverImage: coverImage.url
                }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                     user
                },
                "CoverImage Uploaded Successfully"
            )
        )
})


const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(401, "Username is required")
    }


    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subcribersCount:{
                    size: "$subscribers"
                },
                subscribedToCount:{
                    size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers"]},
                        then:true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                username: 1,
                subcribersCount: 1,
                subscribedToCount: 1,
                email: 1,
                avatar: 1,
                isSubscribed: 1,
                fullName: 1,
                coverImage: 1,
                createdAt: 1,
            }
        }
    ])

    if (!channel?.length){
        throw new ApiError(404, "Channel not found")
    }
    console.log(channel, "CHANNEL")


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "Channel Profile Fetched Successfully"
            )
    )

})


const getWatchHistory = asyncHandler( async  (req, res) => {



    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
,
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watch history fetched successfully"
            )
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    updateUserAvatar,

}