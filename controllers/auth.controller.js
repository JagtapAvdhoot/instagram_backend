const { StatusCodes } = require("http-status-codes");

const User = require("../models/user.model");
const CreateError = require("../middleware/createError");
const { CompareString, HashString } = require("../utils/bcrypt");
const { SignJwt } = require("../utils/jwt");
const { ResponseSuccess } = require("../utils/response");

exports.SignIn = async (req, res, next) => {
  const { field, password } = req.body;
  if (!field || !password)
    return next(
      CreateError(
        StatusCodes.BAD_REQUEST,
        "provide username or email and password"
      )
    );

  let user;
  try {
    user = await User.findOne({
      $or: [{ username: field }, { email: field }]
    });

    if (!user)
      return next(CreateError(StatusCodes.BAD_REQUEST, "wrong credentials"));

    const pwdMatch = CompareString(password, user.password);

    if (!pwdMatch)
      return next(CreateError(StatusCodes.BAD_REQUEST, "wrong credentials"));

    const clientUser = {
      _id: user._id,
      token: user.token
    };

    let token = SignJwt(clientUser);

    ResponseSuccess({ res, data: { token } });
  } catch (error) {
    next(error);
  }
};

exports.SignOut = async (req, res, next) => {
  try {
    ResponseSuccess({ res, message: "logged out" });
  } catch (error) {
    next(error);
  }
};

exports.SignUp = async (req, res, next) => {
  let avatar = process.env.DEFAULT_AVATAR_LINK;

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return next(CreateError(StatusCodes.BAD_REQUEST, "provide valid inputs"));
  }
  const hashPwd = HashString(password);
  const newUser = new User({
    username,
    email,
    password: hashPwd,
    avatar
  });

  try {
    const savedUser = await newUser.save();
    await savedUser.afterCreate(savedUser);

    const clientUser = {
      _id: savedUser._id,
      token: savedUser.token
    };

    let token = SignJwt(clientUser);

    return ResponseSuccess({ res, data: { token } });
  } catch (error) {
    next(error);
  }
};
