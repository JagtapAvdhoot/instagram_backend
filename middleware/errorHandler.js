const { ResponseFail } = require("../utils/response");

const ErrorHandler = (error, _req, res, _next) => {
  let message = error.message;
  let status = error.status || 500;

  if (error.code === 11000) {
    message = "User already exists";
    status = 400;
  }

  if (process.env.NODE_ENV === "production") {
    message = "Internal Server Error";
    status = 500;
  }

  console.log("****************************");
  console.log(error);
  console.log("****************************");
  ResponseFail({ res, status, message });
};

module.exports = ErrorHandler;
