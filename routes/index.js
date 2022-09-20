const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth.route"));
router.use("/post", require("./post.route"));
router.use("/user", require("./user.route"));
router.use("/comment", require("./comment.route"));
router.use("/like", require("./like.route"));

module.exports = router;
