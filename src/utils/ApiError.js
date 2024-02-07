import { error } from "console";
import { stat } from "fs";

class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong in api errors response go to Api Error or deep",
        errors = [],
        statck = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

// this below code is not neccessary as a beginner but as a production level developer you have to write this to dig in deep
        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export {ApiError}