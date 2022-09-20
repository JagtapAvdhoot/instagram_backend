const { compareSync, genSaltSync, hashSync } = require("bcrypt");

exports.HashString = (string) => {
    const salt = genSaltSync(10, "a");
    const hash = hashSync(string, salt);
    return hash;
};

exports.CompareString = (string, hash) => {
    const match = compareSync(string, hash);
    return match;
};
