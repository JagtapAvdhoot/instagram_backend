const { Router } = require("express");

const { LikeFunctions } = require("../controllers/like.controller");

const isSignedIn = require("../middleware/isSignedIn");

const router = Router();

router.get("/", isSignedIn, LikeFunctions);

module.exports = router;
