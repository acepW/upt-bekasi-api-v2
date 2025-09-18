const jwt = require("jsonwebtoken");

const authMiddlewares = {
  auth: async (req, res, next) => {
    try {
      if (!req.cookies.access_token)
        return res.status(500).json({ msg: "pliss login" });

      jwt.verify(
        req.cookies.access_token,
        process.env.JWT_ACC_SECRET,
        (err, payload) => {
          if (err) {
            res.status(403).json({
              status_code: 403,
              message: "Access token invalid.",
            });
            res.end();
          }
          req.user = payload;
          next();
        }
      );
    } catch (error) {
      res.status(500).json({
        success: false,
        status_code: 500,
        message: err.message,
      });
    }
  },
};

module.exports = authMiddlewares;
