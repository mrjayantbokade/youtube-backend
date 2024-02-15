import { asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";


export const verifyJWT = asyncHandler( async (req, res, next) => {
   const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(401, "Unauthorized")

    }

    const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user){
        throw new ApiError(401, "Invalid Access Token")
    }
})