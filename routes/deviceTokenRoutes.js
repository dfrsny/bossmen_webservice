const express = require("express");
const router = express.Router();
const { registerDeviceToken } = require("../controllers/deviceTokenController");

router.post("/register", registerDeviceToken);

module.exports = router;
