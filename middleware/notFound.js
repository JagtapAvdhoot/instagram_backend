const { ResponseFail } = require("../utils/response");

const NotFound = (req, res, next) => {
  ResponseFail({ res, message: "not a register route" });
};

module.exports = NotFound;
