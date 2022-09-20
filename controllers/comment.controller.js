const { StatusCodes } = require("http-status-codes");
const { Types } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const CreateError = require("../middleware/createError");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const { ResponseSuccess } = require("../utils/response");

exports.CommentPostFunctions = async (req, res, next) => {
  const user = res.user;
  const { query, postId, commentId } = req?.query;
  const { message } = req.body;
  const io = req.app.get("socketio");

  if (!query)
    return ResponseSuccess({
      res,
      message: "Comments section",
      status: StatusCodes.IM_A_TEAPOT
    });

  // to add comment
  if (query == "add-comment") {
    if (!message || !postId)
      return next(
        CreateError(StatusCodes.BAD_REQUEST, "provide a message and post")
      );
    try {
      await Comment.findOneAndUpdate(
        { post: postId },
        {
          $push: {
            comments: {
              _id: uuidv4(),
              user: Types.ObjectId(user._id),
              message,
              date: Date.now()
            }
          }
        }
        // { new: true }
      );

      const { author } = await Post.findOne({ _id: postId }, "author");
      io.sockets.in(author).emit("add-comment", user._id);
      return ResponseSuccess({ res, status: StatusCodes.CREATED });
    } catch (error) {
      next(error);
    }
  }

  try {
    if (!postId || !commentId)
      return next(CreateError(StatusCodes.BAD_REQUEST, "provide a message"));

    const comments = await Comment.findOne({ post: postId }, "comments");

    if (!comments)
      return next(CreateError(StatusCodes.BAD_REQUEST, "comment not found"));

    const requestedComment = comments.comments.filter(
      (comment) => comment._id == commentId
    );

    if (!requestedComment)
      return next(CreateError(StatusCodes.BAD_REQUEST, "comment not found"));
  
    const isAuthor = requestedComment.filter(
      (item) => item.user === Types.ObjectId(user._id)
    );

    if (isAuthor.length == 0)
      return next(CreateError(StatusCodes.FORBIDDEN, "not authorized"));

    // remove comment
    if (query == "remove-comment") {
      const deletedComment = comments.comments.filter(
        (comment) => comment._id !== isAuthor._id
      );
      comments.comments = deletedComment;
      await comments.save();
      console.log("deletedComment: ", deletedComment);
      return ResponseSuccess({ res, message: "comment removed" });
    }

    // update comment
    if (query == "update-comment") {
      if (!message)
        return next(
          CreateError(StatusCodes.BAD_REQUEST, "provide a message and post")
        );
      try {
        comments.comments.forEach((item) => {
          if (item._id === isAuthor._id) {
            item.message = message;
            comments.save().then(() => {
              return ResponseSuccess({ res, message: "comment updated" });
            });
          }
        });
      } catch (error) {
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
};

exports.CommentGetRoutes = async (req, res, next) => {
  const user = res.user;
  const { query, postId, limit, offset } = req?.query;
  const skip = Number(offset) * limit || 0;
  if (!query)
    return ResponseSuccess({
      res,
      message: "Comments section",
      status: StatusCodes.IM_A_TEAPOT
    });

  if (query == "get-comment") {
    if (!postId || !limit)
      return next(
        CreateError(StatusCodes.BAD_REQUEST, "provide post and limit")
      );
    try {
      const comments = await Comment.aggregate([
        { $match: { post: Types.ObjectId(postId) } },
        { $limit: Number(limit) },
        { $sort: skip },
        { $sort: { createdAt: -1 } }
      ]);

      return ResponseSuccess({ res, data: { comments } });
    } catch (error) {
      next(error);
    }
  }
};
