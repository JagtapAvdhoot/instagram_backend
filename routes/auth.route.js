const { Router } = require("express");

const {
  SignIn,
  SignOut,
  SignUp
} = require("../controllers/auth.controller");
const isSignedIn = require("../middleware/isSignedIn");

const router = Router();

router.get("/sign-out", isSignedIn, SignOut);

router.post("/sign-in", SignIn);
router.post("/sign-up", SignUp);

module.exports = router;
