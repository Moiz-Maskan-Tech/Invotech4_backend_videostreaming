import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";

const registerUser = asyncHandler(async (req, res) => {
  // get the details from the client/frontend
  // validate = not empty
  // check if user already exists
  // check for images , check for avatar
  // upload them on cloudinary ex avatar
  // create a user object - create an entry in db
  // remove password & refresh token field from the response
  // check for the user creation
  // return response

  const { fullname, email, username, password } = req.body;
  console.log(req.body);

  const fields = { fullname, email, username, password };
  for (let field in fields) {
    if (!fields[field].trim()) {
      throw new ApiError(400, `${field} is required`);
    }
  }

  //put the await here to resolve the error
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  //   console.log('user is there  : ',existedUser)

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  //   req.files.avatar[0].path
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  const coverImageLocalPath = req?.files?.coverImage[0]?.path;

  console.log("avatar", avatarLocalPath);
  console.log("cover imahe", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is requied");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar field is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // console.log('user created : ',user)

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body => data
  // check username or email
  // check wether password is there or not
  // find the user
  // password check
  // access token and refresh token
  // send cookies
  // validation

  const { email, username, password } = req.body; // req body => data

  if (!username || !email) {
    // check username or email
    throw new ApiError(400, "username or email is required");
  }

  if (!password) {
    // check wether password is there or not
    throw new ApiError(400, "password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in succefully"
      )
    );
});

const generateAccessAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.gererateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access and refresh token"
    );
  }
};

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggedout succesfully"));
});

export { registerUser, loginUser, logoutUser };
