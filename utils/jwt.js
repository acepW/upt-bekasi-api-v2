const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const JwtAccessToken = {
  generate_access_token: (payload) => {
    const access_token = jwt.sign(payload, process.env.JWT_ACC_SECRET);
    return access_token;
  },
};

module.exports = JwtAccessToken;
