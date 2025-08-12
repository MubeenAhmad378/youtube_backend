import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new ApiError(401, "Unauthorized Request");
        }
    
        // Verify token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Find user in DB
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        // Attach user to request for further use
        req.user = user;
    
        // Pass control to next middleware/controller
        next();
    } catch (error) {
      throw new ApiError(401 , error?.message || "Invalid Access Token")   
    }
});
