import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadONCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { request } from "express";


const registerUser = asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation -not empty 
    // check if user already exist:username sy b or email sy b 
    // check for images.checky kry gy avatar image ko because wo required hai user model k ander
    // upload them on cloudinary - avatar
   //  create user object - create entry in db
   // remove password and refresh token from response
   // check for user creation 
   // return response




    const {username,email,fullName,password} = req.body
    //console.log("email:",email)


    if(
        [username,email,fullName,password].some((field)=>field?.trim()==="")
    ){
      throw new ApiError(400,"fullname is required")
    }
    // email me @ ka check
     if (!email.includes("@")) {
     throw new ApiError(400, "Invalid email format")

    }

    const existedUser = await User.findOne({
        $or :  [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409 ,"user with email or username is already exist")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path ;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath = "";
if (req.files?.coverImage?.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
}

    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar = await uploadONCloudinary(avatarLocalPath);
    const coverImage =await uploadONCloudinary(coverImageLocalPath);
    


    if(!avatar){
        throw new ApiError(400,"Avatar file is required")

    }
  


    const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username?.toLowerCase()
    });

   // Fetch the user again but without password and refreshToken
    const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
      );
   
      if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
      }
     
      
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user register successfully")
    )  
      
})



export {registerUser};