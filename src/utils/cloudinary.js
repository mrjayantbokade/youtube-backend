import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
import path from "path";
import { error, log } from "console";



dotenv.config({
    path: "./env"
})


          
cloudinary.config({ 
  cloud_name: `${process.env.CLOUD_NAME}`, 
  api_key: `${process.env.CLOUDINARY_API_KEY}`, 
  api_secret: `${process.env.CLOUDINARY_API_SECRET}` 
});


const uploadOnCloudinary = async(localFilePath) =>{
    try {
        
        // if file not found give error and return
        if(!localFilePath) return null

        // otherwise do this
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // console.log(`file uploaded successfully ${response.url}`);

        // console.log(`See what you got ${response}`);
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the file from locally saved server to not collect corrupt file and other things that can stress server
        console.log(error, ": go to cloudinary.js in utils");
        return null

    }
}


export { uploadOnCloudinary }