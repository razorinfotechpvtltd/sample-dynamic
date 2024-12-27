const { isCelebrateError } = require("celebrate");

const errorHandler = {
  handleError() {
    const handleValidationError = (err, req, res, next) => {
      const code = 400;
      let details = [];

      if (err.details) {
        err.details.forEach((error) => {
          // console.log(error.context);
          details.push({
            message: error.message,
            key: error.context?.key,
          });
        });
      }

      return res.status(code).json({
        code,
        details,
        error: "Bad Request",
        message: "Validation Error",
      });
    };

    return (err, req, res, next) => {
      if (isCelebrateError(err) || err.IsValidation)
        handleValidationError(err, req, res, next);
    };
  },
};
module.exports = errorHandler;
