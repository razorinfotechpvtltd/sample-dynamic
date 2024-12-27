const { Joi } = require('celebrate');

const workSpaceValidation = {
    REGISTER_WORKSPACE: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
        domainName: Joi.string().pattern(/^[a-zA-Z0-9-]+$/).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }),
    VERIFY_OTP: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().pattern(/^\d{6}$/).required(),
    }),
    RESEND_OTP: Joi.object({
        email: Joi.string().email().required(),
    }),
};

module.exports = workSpaceValidation;
