const { Schema, model } = require("mongoose");

const CommentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", require: true },
    comments: [],
  }
);

CommentSchema.methods = {};

const Comment = model("Comment", CommentSchema);

module.exports = Comment;
