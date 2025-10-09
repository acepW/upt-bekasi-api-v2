const router = require("express").Router();
const ArticleController = require("../controller/articleController");
const { auth } = require("../middlewares/authMiddlewares");

router.get("/article", ArticleController.getArticle);
router.get("/article/:id", ArticleController.getArticle);
router.post("/article", auth, ArticleController.createArticle);
router.put("/article/:id", auth, ArticleController.updateArticle);
router.delete("/article/:id", auth, ArticleController.deleteArticle);

module.exports = router;
