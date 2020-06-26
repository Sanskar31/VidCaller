const express= require('express');

const controller= require('../controllers/userControllers');

const router = express.Router();

router.get('/login', controller.getLogin);
router.get('/my-account', controller.getmyAccount);

module.exports= router;
