const { Router } = require("express");

const {
  PostGetFunctions,PostPostFunctions
} = require("../controllers/post.controller");
const isSignedIn = require("../middleware/isSignedIn");

const router = Router();

router.get("/", isSignedIn, PostGetFunctions);

router.post("/", isSignedIn,PostPostFunctions);

module.exports = router;
