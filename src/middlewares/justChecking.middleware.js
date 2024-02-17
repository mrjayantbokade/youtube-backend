import { error, log } from "console";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const justloginUser = asyncHandler( async (req, res, next) => {

    const {username, password} = req.body
    const user = await User.findOne(username)
    if (!user) {
        console.log("USER NOT FOUND");
        
        return next(new ApiError(404, "USER NOT FOUND"))
    }
    
    console.log('THIS IS USER: ', user?.username);
    console.log('PASSWORD: ', user?.password);

    res.send({user: username, password })
    next()
})
