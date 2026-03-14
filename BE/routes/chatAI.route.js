var express = require("express");
var router = express.Router();
const { askAI } = require("../controller/chatAI.controller");

router.post("/ask", askAI);

module.exports = router;
