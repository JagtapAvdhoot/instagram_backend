const { StatusCodes } = require("http-status-codes");
const { Schema, model, Types } = require("mongoose");

const CreateError = require("../middleware/createError");

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", require: true },
  description: { type: String },
  hashTags: [],
  like: { type: Schema.Types.ObjectId, ref: "Like" },
  comment: { type: Schema.Types.ObjectId, ref: "Comment" },
  tags: [],
  file: [],
  location: String,
  report:[],
  date: () => Date.now(),
  available: {
    type: Boolean,
    default: false
  },
  bookmark: []
});

PostSchema.methods = {
  afterCreate: async (post, user) => {
    try {
      const userUpdate = await model("User").findOneAndUpdate(
        { _id: user._id },
        { $push: { post: Types.ObjectId(post._id) } },
        { new: true }
      );
      const comments = await model("Comment").create({ post: post._id });
      const likes = await model("Like").create({ post: post._id });
      const postUpdate = await model("Post").findOneAndUpdate(
        { _id: post._id },
        { $set: { like: likes._id, comment: comments._id } }
      );
      return [userUpdate, comments, likes, postUpdate];
    } catch (error) {
      return CreateError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "something went wrong in mongoose after create post"
      );
    }
  },
  beforeDelete: async (post, user) => {
    const userUpdate = await model("User").findOneAndUpdate(
      { _id: user._id },
      { $pull: { post: Types.ObjectId(post._id) } },
      { new: true }
    );
    const commentUpdate = await model("Comment").deleteOne({ post: post._id });
    const likeUpdate = await model("Like").deleteOne({ post: post._id });
    const postUpdate = await model("Post").deleteOne({ _id: post._id });
    return [userUpdate, commentUpdate, likeUpdate, postUpdate];
  }
};

const Post = model("Post", PostSchema);

module.exports = Post;
