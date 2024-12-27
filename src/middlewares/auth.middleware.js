import { asyncHandler } from "../utils/asyncHandler.utils.js ";
import { ApiError } from "../utils/ApiError.utils.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ACCESS_TOKEN_SECRET } from "../constants.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodeToken = jwt.verify(token, ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid access token");
  }
});
