const { StatusCodes } = require("http-status-codes");
const fs = require("fs");
const path = require("path");
const { Types } = require("mongoose");

const CreateError = require("../middleware/createError");
const { ResponseSuccess } = require("../utils/response");
const Post = require("../models/post.model");
const Following = require("../models/following.model");
const { CloudinaryUploader } = require("../utils/cloudinary");
const Follower = require("../models/follower.model");
const User = require("../models/user.model");


exports.PostGetFunctions = async (req, res, next) => {
  const user = res.user;
  const { query, limit, offset, postId, userId } = req?.query;
  let skip = (Number(offset) - 1) * Number(limit);

  if (!query)
    return ResponseSuccess({
      res,
      message: "Posts section",
      status: StatusCodes.IM_A_TEAPOT
    });

  if (query == "get-following" || query == "get-favorite") {
    try {
      if (!limit)
        return next(CreateError(StatusCodes.BAD_REQUEST, "provide some limit"));

      const userCloseFriends = await User.findById(user._id, "favorite");
      const followingDoc = await Following.findOne(
        { author: user._id },
        "followings"
      );

      if (followingDoc.followings.length === 0)
        return next(
          CreateError(StatusCodes.NO_CONTENT, "you don't follow any one")
        );

      if (query == "get-favorite" && userCloseFriends.favorite.length == 0)
        return next(
          CreateError(
            StatusCodes.NO_CONTENT,
            "you don't have any favorites... add some"
          )
        );

      const filterFollowingDoc = followingDoc.followings.map((follower) =>
        Types.ObjectId(follower.user)
      );

      const filterFavorite = userCloseFriends.favorite.map((usr) =>
        Types.ObjectId(usr.user)
      );

      const filterFrom =
        query == "get-favorite" ? filterFavorite : filterFollowingDoc;

      const posts = await Post.aggregate([
        {
          $match: {
            $and: [
              { author: Types.ObjectId(user._id) },
              { author: { $in: filterFrom } }
            ]
          }
        },
        {
          $skip: skip
        },
        {
          $limit: Number(limit)
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "post",
            as: "like"
          }
        },
        {
          $unwind: "$like"
        },
        {
          $unwind: "$user"
        },
        {
          $addFields: {
            post_likes: { $size: "$like.likes" }
          }
        },
        {
          $project: {
            _id: true,
            author: true,
            description: true,
            file: true,
            location: true,
            bookmark: true,
            createdAt: true,
            available: true,
            user: {
              _id: true,
              avatar: true,
              username: true,
              email: true
            },
            post_links: true
          }
        }
      ]);
      const count = await Post.aggregate([
        {
          $match: {
            $and: [
              { author: { $in: filterFrom } },
              { author: Types.ObjectId(user._id) }
            ]
          }
        },
        {
          $count: "count"
        }
      ]);
      return ResponseSuccess({
        res,
        data: { posts, post_count: count[0]?.count }
      });
    } catch (error) {
      next(error);
    }
  }

  if (query == "get-user") {
    try {
      const posts = await Post.aggregate([
        { $match: { author: Types.ObjectId(userId) } },
        {
          $skip: skip
        },
        {
          $limit: Number(limit)
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "post",
            as: "like"
          }
        },
        {
          $unwind: "$like"
        },
        {
          $addFields: {
            post_likes: { $size: "$like.likes" }
          }
        },
        {
          $project: {
            _id: true,
            file: true,
            available: true,
            post_links: true
          }
        }
      ]);
      const count = await Post.aggregate([
        {
          $limit: limit
        },
        {
          $skip: skip
        },
        {
          $count: "count"
        }
      ]);

      return ResponseSuccess({
        res,
        data: { posts, post_count: count[0]?.count }
      });
    } catch (error) {
      next(error);
    }
  }

  if (query == "get-explore") {
    try {
      const posts = await Post.aggregate([
        {
          $skip: skip
        },
        {
          $limit: Number(limit)
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "post",
            as: "like"
          }
        },
        {
          $unwind: "$like"
        },
        {
          $addFields: {
            post_likes: { $size: "$like.likes" }
          }
        },
        {
          $project: {
            _id: true,
            file: true,
            available: true,
            post_links: true
          }
        }
      ]);
      const count = await Post.aggregate([
        {
          $limit: limit
        },
        {
          $skip: skip
        },
        {
          $count: "count"
        }
      ]);

      return ResponseSuccess({
        res,
        data: { posts, post_count: count[0]?.count }
      });
    } catch (error) {
      next(error);
    }
  }

  if (query == "get-bookmark") {
    try {
      const posts = await Post.aggregate([
        {
          $match: { bookmark: { $in: Types.ObjectId(user._id) } }
        }
      ]);
      return ResponseSuccess({ res, data: { posts } });
    } catch (error) {
      next(error);
    }
  }

  if (query == "bookmark") {
    try {
      const bookmarkUpdate = await Post.updatedOne(
        { _id: postId, "bookmark.user": { $ne: user._id } },
        { $addToSet: { bookmark: { user: user._id } } },
        { new: true }
      );
      if (bookmarkUpdate.modifiedCount == 0) {
        await Post.updatedOne(
          { _id: postId },
          { $pull: { bookmark: { user: user._id } } }
          // { new: true },
        );

        return ResponseSuccess({ res, message: "bookmark removed" });
      }
      return ResponseSuccess({ res, message: "bookmark added" });
    } catch (error) {
      next(error);
    }
  }
};

exports.PostPostFunctions = async (req, res, next) => {
  const user = res.user;
  const { query, postId } = req?.query;

  if (!query)
    return ResponseSuccess({
      res,
      message: "Posts section",
      status: StatusCodes.IM_A_TEAPOT
    });

  if (query == "create-post") {
    const { files, description, tags, hashTags } = req.body;
    let uploadedFiles = [];

    if (!files || files.length > 5)
      return next(
        CreateError(StatusCodes.BAD_REQUEST, "you can only upload 5 files")
      );

    let savedPost;
    try {
      const newPost = new Post({
        author: user._id,
        description,
        tags,
        hashTags
      });
      savedPost = await newPost.save();
      await savedPost.afterCreate(savedPost, user);
      return ResponseSuccess({ res, message: "post is being processed" });
    } catch (error) {
      next(error);
    }

    try {
      for (let file of files) {
        const cloudinaryResponse = await CloudinaryUploader(file);
        uploadedFiles.push(cloudinaryResponse);
      }
    } catch (error) {
      next(error);
    } finally {
      await Post.findOneAndUpdate(
        { _id: savedPost._id },
        { $set: { file: uploadedFiles, available: true } }
      );
    }
  }

  if (!postId || !Types.ObjectId.isValid(postId))
    return next(CreateError(StatusCodes.BAD_REQUEST, "provide a post"));

  const requestedPost = await Post.findById(postId);

  if (!requestedPost)
    return next(CreateError(StatusCodes.NOT_FOUND, "post not found"));

  if (query == "update-post") {
    const { description, tags, hashTags } = req.body;
    if (description) {
      if (description.length > 150) return;
      requestedPost.description = description;
    }
    if (tags) {
      requestedPost.tags = tags;
    }
    if (hashTags) {
      requestedPost.hashTags = hashTags;
    }
    try {
      await requestedPost.save();
      return ResponseSuccess({ res, message: "post updated" });
    } catch (error) {
      next(error);
    }
  }
  if (query == "delete-post") {
    try {
      await requestedPost.beforeDelete(requestedPost, user);
      return ResponseSuccess({ res, message: "post deleted" });
    } catch (error) {
      next(error);
    }
  }
  if(query=='report-post'){
    const { message } = req.body;
    const reportedPost = await Post.findOneAndUpdate(
      { _id: postId, "report.user": { $ne: user._id } },
      {
        $push: { report: { user: user._id, message, date: Date.now() } }
      }
    );

    if (reportedPost == null) {
      return ResponseSuccess({
        res,
        status: StatusCodes.NOT_MODIFIED,
        message: "post already reported"
      });
    }
    return ResponseSuccess({ res, message: "post reported" });
  }
};
