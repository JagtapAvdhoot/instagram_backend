// where data is object
exports.ResponseSuccess = ({ res, status = 200, message = "", data = {} }) => {
  return res.status(status).json({ success: true, message, ...data });
};

exports.ResponseFail = ({ res, status = 500, message = 500, data = {} }) => {
  return res.status(status).json({ success: false, message, ...data });
};
