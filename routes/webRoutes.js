const express = require("express");

const { ensureAuthenticated } = require("../config/auth");
const controller = require("../controllers/webControllers");

const router = express.Router();

router.get("/about-us", controller.getaboutUs);

router.post("/join-room", controller.joinRoom);

router.get("/room/:roomId", ensureAuthenticated, controller.getRoom);

router.get("/", controller.getHome);

module.exports = router;
