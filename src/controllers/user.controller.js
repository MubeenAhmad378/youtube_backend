import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadONCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { request } from "express";



const generateAccessAndRefreshTokens = async(userId)=>{
    try {
       const user = await User.findById(userId)
       const accessToken =user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave : false})

       return{accessToken,refreshToken}
        
    } catch (error) {
       throw new  ApiError(500,"something went wrong while generating access and refresh token")
    }
}


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

const loginUser = asyncHandler(async(req,res)=>{
    // request body -> data
    // username or email 
    // find the user 
    // password check 
    // access and refresh token bejy gy 
    // send cokooies ->access and refresh token ko cookies me bejty hai .



    const {username,email , password} = req.body
     
    if(!username && !email){
        throw new ApiError(400 , "username or email is required")
    }
    
    const user = await User.findOne({
        $or : [{username},{email}]
    })
    
    if (!user){
        throw new ApiError (404 , "user does not exists")
    }
    

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid){
        throw new ApiError (401 , "invalid user credentail")
    }


    const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true 
    }   

    return res
    .status(200)
    .cookie("accessToken",accessToken ,options)
    .cookie("refreshToken" , refreshToken ,options)
    .json(
        new ApiResponse(
            200, 
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "User logged In Successfully"
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
        { new: true } // options here
    );

    const options = {
        httpOnly : true,
        secure : true 
    }   


    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200,{},"User LoggedOut Successsfully "))
})



const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorize Request")
    }
    try {
        const decodedToken =jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401 , "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token is Expired or used ")
        }
    
        const options = {
            httpOnly : true,
            secure : true 
        }   
       const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
    
        .json(new ApiResponse(
            200,
            {
               accessToken ,refreshToken:newRefreshToken
            },
            "Access Token Refresh Successsfully "))
    } catch (error) {
        throw new ApiError (401, error?.message || "Invalid refresh token")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}