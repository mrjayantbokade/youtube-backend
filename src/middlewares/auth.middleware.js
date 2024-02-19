import { asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv"

dotenv.config({
    path: "./env"
})


export const verifyJWT = asyncHandler( async (req, _, next) => {
   try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     // console.log("TOKENM", token);
     // console.log("HELLO TOKEN");
     if(!token){
         throw new ApiError(401, "Unauthorized")
 
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user){
         throw new ApiError(401, "Invalid Access Token")
     }
       req.user = user;
     next()
   } catch (error) {
     console.log("ERROR AT CATCH");
       throw new ApiError(401,error?.message || "Invalid Access Token")
    
   }
})

