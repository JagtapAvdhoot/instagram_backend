const { URL } = require("url");

exports.validURL = (website) => {
  try {
    let valid = new URL(website);
    return false;
  } catch (error) {
    return true;
  }
};

exports.validUsername = (username) => {
  var usernameRegex = /^[a-z0-9_\.]+$/;
  const validity = usernameRegex.test(username);
  return validity;
};

exports.validEmail = (email) => {
  const emailRegex =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  const validity = emailRegex.test(email);
  return !validity;
};
