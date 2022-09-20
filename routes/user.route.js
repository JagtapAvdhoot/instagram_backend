const { Router } = require("express");

const {
  UserGetFunctions,
  UserPostFunctions
} = require("../controllers/user.controller");

const isSignedIn = require("../middleware/isSignedIn");

const router = Router();

router.get("/", isSignedIn, UserGetFunctions);

router.post("/create", isSignedIn, UserPostFunctions);

module.exports = router;
