const { Schema, model } = require("mongoose");

const FollowingSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", require: true },
    followings: [],
  }
);

FollowingSchema.methods = {};

const Following = model("Following", FollowingSchema);

module.exports = Following;
