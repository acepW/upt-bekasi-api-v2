const router = require("express").Router();
const {
  getUsers,
  createUsers,
  updateUsers,
  deleteUsers,
} = require("../controller/auth/userController");
const { auth } = require("../middlewares/authMiddlewares");

router.get("/users", auth, getUsers);
router.get("/users/:id", auth, getUsers);
router.post("/users", auth, createUsers);
router.put("/users/:id", auth, updateUsers);
router.delete("/users/:id", auth, deleteUsers);

module.exports = router;
