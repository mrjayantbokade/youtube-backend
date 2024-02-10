import { error } from "console"

const asyncHandler = (requestHandler) =>{

     return (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>{next(err)})
    }
}


export  {asyncHandler}




// const asyncHandler = (fn) => async(error, req, res, next) =>{
//     try {
//         await fn(err, req, res, next)
        
//     } catch (error) {
//        req.staus(err.code || 500).json({
//         sucsess: false,
//         message: err.message
//        })
        
//     }
// } 