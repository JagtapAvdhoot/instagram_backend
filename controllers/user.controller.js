const { StatusCodes } = require("http-status-codes");
const { Types } = require("mongoose");

const CreateError = require("../middleware/createError");
const { ResponseSuccess } = require("../utils/response");
const User = require("../models/user.model");
const Follower = require("../models/follower.model");
const Following = require("../models/following.model");
const { CloudinaryUploader } = require("../utils/cloudinary");
const Post = require("../models/post.model");

exports.UserGetFunctions = async (req, res, next) => {
  const user = res.user;
  const { query, fields, search, userId, limit, offset } = req?.query;
  let skip = (Number(offset) - 1) * Number(limit) || 0;

  if (!query)
    return ResponseSuccess({
      res,
      message: "Users section",
      status: StatusCodes.IM_A_TEAPOT
    });

  if (query == "get-search") {
    try {
      const userList = await User.find({
        $or: [
          { username: { $regex: new RegExp(search), $options: "i" } },
          { email: { $regex: new RegExp(search), $options: "i" } }
        ]
      })
        .select("username avatar email _id")
        .skip(skip)
        .limit(5);

      return ResponseSuccess({ res, data: { userList } });
    } catch (error) {
      next(error);
    }
  }
  if (query == "get-username") {
    try {
      const usernames = await User.find({
        username: { $regex: new RegExp(search), $options: "i" }
      })
        .limit(Number(limit))
        .skip(skip)
        .select("username");
      return ResponseSuccess({ res, data: { usernames } });
    } catch (error) {
      next(error);
    }
  }
  if (query == "get-email") {
    try {
      const emails = await User.find({
        email: { $regex: new RegExp(search), $options: "i" }
      })
        .limit(7)
        .skip(skip)
        .select("email");
      return ResponseSuccess({ res, data: { emails } });
    } catch (error) {
      next(error);
    }
  }
  if (!userId || userId == undefined || !Types.ObjectId.isValid(userId))
    return next(CreateError(StatusCodes.BAD_REQUEST, "provide a user"));

  const isUser = await User.findById(userId).select(
    "_id username email avatar"
  );

  if (!isUser)
    return next(CreateError(StatusCodes.NOT_FOUND, "provided user not found"));

  if (query == "get-user") {
    console.log("userId: ", userId);
    const userUnset = [
      "password",
      "createdAt",
      "updatedAt",
      "bookmark",
      "closeFriend",
      "favorite",
      "post",
      "like",
      "comment",
      "token",
      "following",
      "follower",
      "gender",
      "__v"
    ];
    const requestedUser = await User.aggregate([
      {
        $match: {
          $or: [
            { username: userId },
            { email: userId },
            { _id: Types.ObjectId(userId) }
          ]
        }
      },
      {
        $unset: userUnset
      },
      {
        $lookup: {
          from: "followings",
          localField: "_id",
          foreignField: "author",
          as: "following"
        }
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "author",
          as: "follower"
        }
      },
      {
        $unwind: "$follower"
      },
      {
        $unwind: "$following"
      },
      {
        $addFields: {
          followers: "$follower.followers",
          followings: "$following.followings"
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          avatar: 1,
          followers: 1,
          followings: 1,
          bio: 1
        }
      }
    ]);
    const count = await Post.aggregate([{ $count: "post_count" }]);
    return ResponseSuccess({
      res,
      data: { user: requestedUser, postCount: count[0]?.post_count }
    });
  }

  if (query == "follow") {
    try {
      const followingUpdate = await Following.updateOne(
        { author: user._id, "followings.user": { $ne: userId } },
        { $addToSet: { followings: { user: userId } } }
        // { new: true },
      );

      const followerUpdate = await Follower.updateOne(
        { author: userId, "followers.user": { $ne: user._id } },
        { $addToSet: { followers: { user: user._id } } }
        // {new:true}
      );

      if (
        followerUpdate.modifiedCount == 0 &&
        followingUpdate.modifiedCount == 0
      ) {
        await Following.updateOne(
          { author: user._id },
          { $pull: { followings: { user: userId } } }
          // { new: true },
        );

        await Follower.updateOne(
          { author: userId },
          { $pull: { followers: { user: user._id } } }
          // {new:true}
        );

        return ResponseSuccess({ res, message: "user un-followed" });
      }
      return ResponseSuccess({ res, message: "user followed" });
    } catch (error) {
      next(error);
    }
  }

  if (query == "favorite") {
    try {
      const favoriteUpdate = await User.updateOne(
        { _id: user._id, "favorite.user": { $ne: userId } },
        { $addToSet: { favorite: { user: userId } } }
      );
      if (favoriteUpdate.modifiedCount == 0) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { favorite: { user: userId } } }
        );
        return ResponseSuccess({ res, message: "user removed from favorites" });
      }
      return ResponseSuccess({ res, message: "user added to favorites" });
    } catch (error) {
      next(error);
    }
  }

  if (query == "close-friend") {
    try {
      const closeFriendUpdate = await User.updateOne(
        { _id: user._id, "closeFriend.user": { $ne: userId } },
        { $addToSet: { closeFriend: { user: userId } } }
      );
      if (closeFriendUpdate.modifiedCount == 0) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { closeFriend: { user: userId } } }
        );
        return ResponseSuccess({
          res,
          message: "user removed from close friends"
        });
      }
      return ResponseSuccess({
        res,
        message: "user added to close friends"
      });
    } catch (error) {
      next(error);
    }
  }
};
exports.UserPostFunctions = async (req, res, next) => {
  const user = res.user;
  const { query, userId } = req?.query;
  let avatar = process.env.DEFAULT_AVATAR_LINK;

  const signedUser = await User.findById(user._id);

  if (query == "update-bio") {
    try {
      const { bio } = req.body;
      signedUser.bio = bio;
      await signedUser.save();
    } catch (error) {
      next(error);
    }
  }
  if (query == "update-website") {
    try {
      const { website } = req.body;
      signedUser.website = website;
      await signedUser.save();
    } catch (error) {
      next(error);
    }
  }
  if (query == "update-gender") {
    try {
      const { gender } = req.body;
      signedUser.gender = gender;
      await signedUser.save();
    } catch (error) {
      next(error);
    }
  }
  if (query == "remove-user") {
    try {
      await signedUser.beforeDelete(signedUser);
    } catch (error) {
      next(error);
    }
  }
  if (query == "change-profile") {
    const { profile } = req.body;
    if (!profile)
      return next(
        CreateError(
          StatusCodes.BAD_REQUEST,
          "provide an image to change avatar"
        )
      );

    let uploadedShit;

    try {
      uploadedShit = await CloudinaryUploader(profile);
    } catch (error) {
      next(
        CreateError(StatusCodes.NOT_ACCEPTABLE, "error while uploading profile")
      );
    } finally {
      signedUser.avatar = uploadedShit;
      await signedUser.save();
      return ResponseSuccess({ res, message: "avatar changed" });
    }
  }
  if (query == "remove-profile") {
    try {
      await User.updateOne(
        { _id: user._id },
        { $set: { avatar } }
        // { new: true },
      );
      return ResponseSuccess({ res, message: "remove avatar" });
    } catch (error) {
      next(error);
    }
  }
  if (query == "change-private") {
    try {
      const privateUpdate = await User.findById(user._id, "private");

      ResponseSuccess({ res, message: "make account private route" });

      if (privateUpdate.private) {
        await User.findByIdAndUpdate(user._id, {
          $set: { private: false }
        });
        return;
      }
      await User.findByIdAndUpdate(user._id, { $set: { private: true } });
    } catch (error) {
      next(error);
    }
  }

  if (!userId || userId == undefined || !Types.ObjectId.isValid(userId))
    return next(CreateError(StatusCodes.BAD_REQUEST, "provide a user"));

  if (query == "add-report") {
    const { message } = req.body;
    const reportedUser = await User.findOneAndUpdate(
      { _id: userId, "report.user": { $ne: user._id } },
      {
        $push: { report: { user: user._id, message, date: Date.now() } }
      }
    );

    if (reportedUser == null) {
      return ResponseSuccess({
        res,
        status: StatusCodes.NOT_MODIFIED,
        message: "user already reported"
      });
    }
    return ResponseSuccess({ res, message: "user reported" });
  }
};
