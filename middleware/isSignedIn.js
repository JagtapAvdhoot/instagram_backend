const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const { VerifyJwt } = require("../utils/jwt");

const CreateError = require("./createError");

const isSignedIn = async (req, res, next) => {
    const accessToken =
    req.headers.authorization || req.signedCookies.atomic_ig;

    if (!accessToken)
        return next(
            CreateError(StatusCodes.FORBIDDEN, "you are not logged in")
        );

    try {
        const decodedUser = VerifyJwt(accessToken);

        if (!decodedUser)
            return next(
                CreateError(StatusCodes.BAD_REQUEST, "token has been expired")
            );

        const isUser = await User.findOne(
            { token: decodedUser.token },
            "_id token"
        );

        if (!isUser)
            return next(CreateError(StatusCodes.NOT_FOUND, "not authorized"));

        res.user = decodedUser;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = isSignedIn;
