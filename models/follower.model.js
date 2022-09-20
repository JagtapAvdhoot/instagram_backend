const { Schema, model } = require("mongoose");

const FollowerSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", require: true },
    followers: [],
  }
);

FollowerSchema.methods = {};

const Follower = model("Follower", FollowerSchema);

module.exports = Follower;
