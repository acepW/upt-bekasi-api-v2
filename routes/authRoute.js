const router = require("express").Router();
// const rateLimit = require("express-rate-limit");
const { Login, Logout, Me } = require("../controller/auth/authController");
const { auth } = require("../middlewares/authMiddlewares");

router.get("/me", auth, Me);
router.post("/login", Login);
router.delete("/logout", Logout);

module.exports = router;
