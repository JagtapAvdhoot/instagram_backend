const { Schema, model } = require("mongoose");

const LikeSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", require: true },
    likes: [],
  }
);

LikeSchema.methods = {};

const Like = model("Like", LikeSchema);

module.exports = Like;
