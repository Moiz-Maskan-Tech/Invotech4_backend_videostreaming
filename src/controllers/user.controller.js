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

const ChangeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log("oldPassword : ", oldPassword);
  console.log("newPassword : ", newPassword);

  const user = await User.findById(req.user?._id);
  const isPassowrdCorrect = await user.isPassowrdCorrect(oldPassword);

  if (!isPassowrdCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed succesfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Accounts Details updated succesfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading the avatar on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.res?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(ApiResponse(200, user, "avatar image updated succesfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover imahe missing");
  }

  const coverImage = uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading the file");
  }

  const user = User.findByIdAndUpdate(req.res?._id, {
    $set: {
      coverImage: coverImage.url,
    },
  }).select("-password");

  res
    .status(200)
    .json(ApiResponse(200, user, "converImage updated succesfully"));
});

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {username} = req.params;

  if(!username.trim()){
    throw new ApiError(400,"Username is missing")
  }

  const channel = await User.aggregate([
    {
      $match : {
        username : username?.toLowerCase()
      }
    },
    {
      $lookup : {
        from :"Subscriptions",
        localField : "_id",
        foreignField : "Channel",
        as : "subscribers"
      }
    },
    {
      $lookup : {
        from :"Subscriptions",
        localField : "_id",
        foreignField : "Subscriber",
        as : "subscribedTo"
      }
    },
    {
      $addFields : {
        SubscriberCount : {
          $size : "$subscribers"
        },
        ChannelSubscribedToCount : {
          $size : "$subscribedTo"
        },
        isSubscribed : {
          $count : {
            if:{
              $in : [req.user?._id,"$subscribers.subscribe"],
              then : true,
              else : false
            }
          }
        }
      }
    },
    {
      $project : {
        fullname : 1,
        username : 1,
        SubscriberCount : 1,
        ChannelSubscribedToCount : 1,
        isSubscribed : 1,
        avatar : 1,
        coverImage : 1,
        email : 1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channed does not exists")
  }

  return res.status(200).json(
    new ApiResponse(200 , Channel[0],"user fetched succesfully")
  )

})

export {
  registerUser,
  loginUser,
  logoutUser,
  ChangeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile
};
