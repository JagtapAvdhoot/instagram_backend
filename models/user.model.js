const { Schema, model, Types } = require("mongoose");
const { randomBytes } = require("crypto");
const CreateError = require("../middleware/createError");
const { StatusCodes } = require("http-status-codes");

const UserSchema = new Schema({
  username: { type: String, unique: true, require: true },
  email: { type: String, unique: true, require: true },
  password: { type: String, require: true },
  bio: String,
  website: String,
  avatar: String,
  gender: {
    type: String,
    enum: ["male", "female", "other", "do not want to specify"]
  },
  follower: { type: Schema.Types.ObjectId, ref: "Follower" },
  following: { type: Schema.Types.ObjectId, ref: "Following" },
  date: () => Date.now(),
  private: {
    type: Boolean,
    default: false
  },
  closeFriend: [],
  favorite: [],
  post: [],
  report:[],
  notification: [],
  token: {
    type: String,
    default: () => randomBytes(40).toString("base64url")
  }
});

UserSchema.methods = {
  afterCreate: async (user) => {
    try {
      const following = await model("Following").create({
        author: user._id
      });
      const follower = await model("Follower").create({
        author: user._id
      });
      const userUpdate = await model("User").findOneAndUpdate(
        { _id: user._id },
        { $set: { following: following._id, follower: follower._id } }
      );
      return { following, follower, userUpdate };
    } catch (error) {
      return CreateError(
        StatusCodes.BAD_REQUEST,
        "error while creating mongodb user"
      );
    }
  },
  beforeDelete: async (user) => {
    try {
      const following = await model("Following").deleteOne({
        author: user._id
      });
      const follower = await model("Follower").deleteOne({
        author: user._id
      });
      const postDelete = await model('Post').find({author:user._id})

      for(let post of postDelete){
        await post.beforeDelete(post,user)
      }
      const userUpdate = await model("User").deleteOne({ _id: user._id });

    } catch (error) {
      return CreateError(
        StatusCodes.BAD_REQUEST,
        "error while deleting account"
      );
    }
  }
};

const User = model("User", UserSchema);

module.exports = User;
