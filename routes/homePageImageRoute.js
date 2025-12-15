const router = require("express").Router();
const {
  getHomePage,
  updateHomePage,
} = require("../controller/homePageImageController");
const { auth } = require("../middlewares/authMiddlewares");

router.get("/home-page-image", auth, getHomePage);
router.put("/home-page-image", auth, updateHomePage);

module.exports = router;
