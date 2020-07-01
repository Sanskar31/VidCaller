const express = require("express");

const controller = require("../controllers/userControllers");

const router = express.Router();

router.get("/login", controller.getLogin);
router.post("/login", controller.postLogin);
router.get("/logout", controller.getLogout);

router.post("/register", controller.register);
router.post("/update-profile", controller.updateProfile);

router.post("/reset-password", controller.getReset);
router.get("/reset-password/:token", controller.getResetPassword);
router.post("/new-password", controller.newPassword);

router.post("/call", controller.startCall);

router.get("/my-account", controller.getmyAccount);

module.exports = router;
