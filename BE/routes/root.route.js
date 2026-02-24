var express = require("express");
var router = express.Router();

router.use("/auth", authRouter);

module.exports = router;