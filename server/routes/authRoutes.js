// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const accountController = require('../controllers/accountController');

//verify id token by google endpoint
router.get('/callback', authController.getCode);
//get access token, refresh token
router.post('/auth/tokens', authController.getTokens);
router.post('/auth/verify/idtoken/google', authController.verifyIdTokenByGoogle);
router.post('/auth/get/newidtoken', authController.getNewIdToken);
router.get('/mitum/account/create', accountController.createAccount);
router.get('/mitum/account/getinfo', accountController.getAccount);
router.post('/mitum/account/transfer', accountController.transfer);
router.post('/mitum/account/updatekey', accountController.updatekey);
module.exports = router;
