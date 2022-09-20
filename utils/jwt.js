const jwt = require("jsonwebtoken");

exports.SignJwt = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS512",
    expiresIn: 1000 * 60 * 60 * 24 * 7 // 7 days
  });
};

exports.VerifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: "HS512"
  });
};
