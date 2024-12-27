const express = require('express');
const { celebrate } = require('celebrate');
const workspaceValidation = require('../validation/workspaceValidation');
const workspaceController = require('../controller/workspaceController');
const router = express.Router();

router.post('/register', celebrate({ body: workspaceValidation.REGISTER_WORKSPACE }), workspaceController.registerForTrial);
router.post('/verify-otp', celebrate({ body: workspaceValidation.VERIFY_OTP }), workspaceController.verifyOTP);
router.post('/resend-otp', celebrate({ body: workspaceValidation.RESEND_OTP }), workspaceController.resendOtp);
// router.post('/register', workspaceController.register);
router.post('/login', workspaceController.login);
router.get('/dashboard',workspaceController.getDashboard);

module.exports = router;

