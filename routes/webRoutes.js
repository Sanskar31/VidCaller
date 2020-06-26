const express= require('express');

const controller= require('../controllers/webControllers');

const router = express.Router();

router.get('/about-us', controller.getaboutUs);

router.get('/', controller.getHome);

module.exports= router;
