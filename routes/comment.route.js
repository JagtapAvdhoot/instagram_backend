const { Router } = require("express");

const {
  CommentPostFunctions,
  CommentGetRoutes
} = require("../controllers/comment.controller");

const isSignedIn = require("../middleware/isSignedIn");

const router = Router();

router.get("/", isSignedIn, CommentGetRoutes);

router.post("/", isSignedIn, CommentPostFunctions);

module.exports = router;
