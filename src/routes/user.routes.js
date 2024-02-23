import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserCoverImage,
    updateUserAvatar,
    updateAccountDetails,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
// import { registerUser, loginUser} from "../controllers/user.controller.js";
import  {upload}  from "../middlewares/multer.middleware.js"
import {ApiError} from "../utils/ApiError.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";


const router = Router()



router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }]),
    registerUser
    )
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
// router.route("/update-coverImage").post( upload.single("coverImage"), updateUserCoverImage)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)

export default router