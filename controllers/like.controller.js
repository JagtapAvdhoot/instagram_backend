const { StatusCodes } = require("http-status-codes");
const { Types } = require("mongoose");
const CreateError = require("../middleware/createError");
const Like = require("../models/like.model");
const { ResponseSuccess } = require("../utils/response");

exports.LikeFunctions = async (req, res, next) => {
  const user = res.user;
  const { query, postId } = req?.query;
  console.log("query, postId: ", query, postId);

  if (!query || !postId)
    return ResponseSuccess({
      res,
      message: "Comments section",
      status: StatusCodes.IM_A_TEAPOT
    });

  if (query == "get") {
    const likes = await Like.findOne({ post: postId }, "likes");
    if (likes.likes) return ResponseSuccess({ res, data: { likes } });
    return next(CreateError(StatusCodes.NO_CONTENT, "likes not found"));
  }

  // like
  if (query == "like") {
    try {
      const results = await Like.updateOne(
        {
          post: postId,
          "likes.user": { $ne: user._id }
        },
        {
          $addToSet: {
            likes: { user: user._id, date: Date.now() }
          }
        },
        { new: true }
      );
      if (results.modifiedCount == 1) {
        await Like.updateOne(
          { post: postId },
          {
            $pull: { likes: { user: user._id } }
          }
        );
        return ResponseSuccess({ res, message: "unlike" });
      }
      return ResponseSuccess({ res, message: "like" });
    } catch (error) {
      next(error);
    }
  }
};
