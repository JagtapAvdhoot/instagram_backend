require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const { createServer } = require("http");
// const csurf = require("csurf");
const { Server } = require("socket.io");

const { randomBytes } = require("crypto");

const ConnectDB = require("./configs/db");
const ErrorHandler = require("./middleware/errorHandler");
const NotFound = require("./middleware/notFound");
const { VerifyJwt } = require("./utils/jwt");
const logger = require("./utils/logger");
const CreateError = require("./middleware/createError");
const { StatusCodes } = require("http-status-codes");

ConnectDB(process.env.MONGO_URL);

const PORT = process.env.PORT || 4000;
const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"]
  })
);
app.use(morgan("dev"));
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET));
app.use(
  session({
    secret: process.env.COOKIE_PARSER_SECRET,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      secure: false,
      signed: true,
      domain: "http://localhost:3000"
    },
    proxy:true,
    name: "atomic_ig_session",
    resave: false,
    saveUninitialized: true
  })
);
// app.use(csurf());

app.use("/api", require("./routes"));

app.use(NotFound);

app.use(ErrorHandler);

const io = new Server(server, {
  cookie: true,
  cors: {
    credentials: true,
    origin: "http://localhost:3000"
  }
});

app.set("socketio", io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (token) {
    const decodedUser = VerifyJwt(token);
    if (!decodedUser)
      return next(CreateError(StatusCodes.BAD_REQUEST, "not authorized"));

    socket.user = decodedUser;

    return next();
  } else {
    return next(
      CreateError(StatusCodes.FORBIDDEN, "not authorized from socket")
    );
  }
}).on("connection", (socket) => {
  const userId = socket.user._id;
  // socket.user._id this is coming from decoded token
  socket.join(userId);

  socket.on("disconnection", (userId) => {
    socket.leave(userId);
  });

  // socket for like comments
  socket.on("like", (receiverUserId) => {
    socket.in(receiverUserId).emit("liked");
  });
  // socket for follower
  socket.on("follow", (receiverUserId, followedUserId) => {
    socket.in(receiverUserId).emit(followedUserId);
  });
  socket.on("unfollow", (data) => {
    console.log(data, "from socket io unfollow");
  });
  // socket for message and message likes
  socket.on("message", (receiverUserId, from, sendedMessage) => {
    socket
      .in(receiverUserId)
      .emit("message", { to: userId, from, message: sendedMessage });
  });
});

server.listen(PORT, (err) => {
  if (err) console.error(err);
  logger.info(`Server running on port:${PORT}`);
});
