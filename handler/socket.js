exports.NewPostSocket = (req, post, receiver) => {
  const io = req.app.get("socketio");
  io.sockets.in(receiver).emit("newPost", post);
};

exports.NewMessageSocket = (req, message, receiver) => {
  const io = req.app.get("socketio");
  io.sockets.in(receiver).emit("newMessage", message);
};
